import { HardhatRuntimeEnvironment } from "hardhat/types";

import fs from "fs-extra";
import { ParseBuildInfo } from "./parsers";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";
import { ContractFileStorageLayout } from "./types";
import { CompareSnapshots } from "./compare-storage-layout-utils";
import isEqual from "lodash.isequal";

export class StorageLayout {
  constructor(private hre_: HardhatRuntimeEnvironment) {}

  async compareSnapshots(fileName: string = "storage_snapshot.json") {
    const savedFilePath = this.resolvePathToFile(this.hre_.config.compare.snapshotPath, fileName);

    if (!fs.existsSync(savedFilePath)) {
      throw new NomicLabsHardhatPluginError(pluginName, "Could not find saved the storage layout!");
    }

    const newSnapshot = await this.makeSnapshot();
    const oldSnapshot: ContractFileStorageLayout[][] = require(savedFilePath);

    if (isEqual(oldSnapshot, newSnapshot)) {
      console.log("Current snapshot is equal with current version of contracts!");
      return;
    }

    const result = CompareSnapshots(oldSnapshot, newSnapshot);
    console.log(JSON.stringify(result, null, 2));
  }

  async saveSnapshot() {
    if (!fs.existsSync(this.hre_.config.compare.snapshotPath)) {
      fs.mkdirSync(this.hre_.config.compare.snapshotPath);
    }

    const fileName = "storage_snapshot.json";
    const saveFilePath = this.resolvePathToFile(this.hre_.config.compare.snapshotPath, fileName);

    await fs.ensureFile(saveFilePath);
    await fs.writeJSON(saveFilePath, await this.makeSnapshot(), { spaces: 2 });
  }

  private async makeSnapshot(): Promise<ContractFileStorageLayout[][]> {
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
