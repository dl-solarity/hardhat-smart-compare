import { HardhatRuntimeEnvironment } from "hardhat/types";

import fs from "fs-extra";
import { ParseBuildInfo } from "./parsers";

export class StorageLayout {
  constructor(private hre_: HardhatRuntimeEnvironment) {}

  async saveSnapshot() {
    if (!fs.existsSync(this.hre_.config.compare.snapshotPath)) {
      fs.mkdirSync(this.hre_.config.compare.snapshotPath);
    }

    const fileName = "storage_snapshot.json";
    const saveFilePath = this.resolvePathToFile(this.hre_.config.compare.snapshotPath, fileName);

    await fs.ensureFile(saveFilePath);
    await fs.writeJSON(saveFilePath, await this.makeSnapshot(), { spaces: 2 });
  }

  private async makeSnapshot() {
    const inspectedBuildInfos: string[] = [];
    const artifacts = [];
    const paths = await this.hre_.artifacts.getAllFullyQualifiedNames();
    for (const path of paths) {
      const contract = await this.hre_.artifacts.getBuildInfo(path);

      if (contract === undefined) {
        continue;
      }

      if (inspectedBuildInfos.includes(contract.id)) {
        continue;
      }

      artifacts.push(ParseBuildInfo(contract));
      inspectedBuildInfos.push(contract.id);
    }

    return artifacts;
  }

  private resolvePathToFile(path_: string, file_: string = ""): string {
    let pathToFile = fs.realpathSync(path_);

    if (pathToFile.substring(pathToFile.length - 1, pathToFile.length) === "/") {
      return pathToFile + file_;
    }

    return pathToFile + "/" + file_;
  }
}
