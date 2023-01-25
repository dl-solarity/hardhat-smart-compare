import { BuildInfo, HardhatRuntimeEnvironment } from "hardhat/types";

import fs from "fs-extra";
import { ParseBuildInfo } from "./parsers";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";
import { BuildInfoData } from "./types";
import { StorageCompare } from "./compare-storage-layout-utils";
import isEqual from "lodash.isequal";
import * as path from "path";
import { Printer } from "./printer";

export class StorageLayout {
  private storageCompare_: StorageCompare;

  constructor(private hre_: HardhatRuntimeEnvironment) {
    this.storageCompare_ = new StorageCompare();
  }

  async compareSnapshots(fileName: string = "storage_snapshot.json") {
    const savedFilePath = this.resolvePathToFile(this.hre_.config.compare.snapshotPath, fileName);

    if (!fs.existsSync(savedFilePath)) {
      throw new NomicLabsHardhatPluginError(pluginName, "Could not find saved snapshot of the storage layout!");
    }

    const newSnapshot = await this.makeSnapshot();
    const oldSnapshot: BuildInfoData[] = require(savedFilePath);

    if (isEqual(oldSnapshot, newSnapshot)) {
      console.log("Current snapshot is equal to the current version of contracts!");
      return;
    }

    new Printer(this.storageCompare_.compareBuildInfos(oldSnapshot, newSnapshot)).print();
  }

  async saveSnapshot(fileName: string = "storage_snapshot.json") {
    if (!fs.existsSync(this.hre_.config.compare.snapshotPath)) {
      fs.mkdirSync(this.hre_.config.compare.snapshotPath, { recursive: true });
    }

    const saveFilePath = this.resolvePathToFile(this.hre_.config.compare.snapshotPath, fileName);

    await fs.ensureFile(saveFilePath);
    await fs.writeJSON(saveFilePath, await this.makeSnapshot());
  }

  private async makeSnapshot(): Promise<BuildInfoData[]> {
    const artifacts: BuildInfoData[] = [];
    const paths = await this.hre_.artifacts.getBuildInfoPaths();

    for (const path of paths) {
      const contract = require(path) as BuildInfo;
      artifacts.push(ParseBuildInfo(contract));
    }

    return artifacts;
  }

  private resolvePathToFile(path_: string, file_: string = ""): string {
    return path.normalize(fs.realpathSync(path_) + "/" + file_);
  }
}
