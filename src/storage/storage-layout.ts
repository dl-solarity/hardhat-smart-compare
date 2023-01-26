import { BuildInfo, HardhatRuntimeEnvironment } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";

import fs from "fs-extra";
import isEqual from "lodash.isequal";
import * as path from "path";

import { ParseBuildInfo } from "./parsers/parsers";
import { InheritanceParser } from "./parsers/inheritance-parser";
import { BuildInfoData } from "./types";
import { Printer } from "./printer";
import { pluginName } from "../constants";
import { StorageCompare } from "./comparing-tools/storage-compare";

export class StorageLayout {
  private storageCompare_: StorageCompare;
  private inheritanceParser_: InheritanceParser;

  constructor(private hre_: HardhatRuntimeEnvironment) {
    this.storageCompare_ = new StorageCompare();
    this.inheritanceParser_ = new InheritanceParser();
  }

  async compareSnapshots(fileName: string) {
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

    new Printer(
      ...this.storageCompare_.compareBuildInfos(oldSnapshot, newSnapshot),
      this.inheritanceParser_.result
    ).print();
  }

  async saveSnapshot(fileName: string) {
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

      this.inheritanceParser_.analyzeInheritanceImpact(contract);
      artifacts.push(ParseBuildInfo(contract));
    }

    return artifacts;
  }

  private resolvePathToFile(path_: string, file_: string = ""): string {
    return path.normalize(fs.realpathSync(path_) + "/" + file_);
  }
}
