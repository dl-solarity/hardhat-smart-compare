import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { BuildInfo, HardhatRuntimeEnvironment } from "hardhat/types";

import fs from "fs-extra";
import isEqual from "lodash.isequal";
import * as path from "path";

import { pluginName } from "../constants";
import { StorageCompare } from "./comparing-tools/storage-compare";
import { InheritanceParser } from "./parsers/inheritance-parser";
import { ParseBuildInfo } from "./parsers/parsers";
import { Printer } from "./printer";
import { BuildInfoData, Snapshot } from "./types";

export class StorageLayout {
  private snapshotPath_: string;
  constructor(private hre_: HardhatRuntimeEnvironment) {
    this.snapshotPath_ = hre_.config.compare.snapshotPath;
  }

  async compareSnapshots(fileName: string) {
    if (!fs.existsSync(this.snapshotPath_)) {
      throw new NomicLabsHardhatPluginError(pluginName, "Could not find directory for storage layout snapshots!");
    }
    const savedFilePath = this.resolvePathToFile(this.snapshotPath_, fileName);

    if (!fs.existsSync(savedFilePath)) {
      throw new NomicLabsHardhatPluginError(pluginName, "Could not find saved snapshot of the storage layout!");
    }

    const newSnapshot: Snapshot = await this.makeSnapshot();
    const oldSnapshot: Snapshot = require(savedFilePath);

    // TODO: Rewrite isEqual to another
    if (isEqual(oldSnapshot, newSnapshot)) {
      console.log("Current snapshot is equal to the current version of contracts!");
      return;
    }

    new Printer(
      ...new StorageCompare().compareBuildInfos(oldSnapshot.buildInfos, newSnapshot.buildInfos),
      oldSnapshot.inheritanceImpact,
      newSnapshot.inheritanceImpact
    ).print();
  }

  async saveSnapshot(fileName: string) {
    if (!fs.existsSync(this.snapshotPath_)) {
      try {
        fs.mkdirSync(this.snapshotPath_, { recursive: true });
      } catch (e) {
        throw new NomicLabsHardhatPluginError(
          pluginName,
          `Could not create directory for storage layout snapshots: '${this.snapshotPath_}'`
        );
      }
    }

    const saveFilePath = this.resolvePathToFile(this.snapshotPath_, fileName);

    await fs.ensureFile(saveFilePath);
    await fs.writeJSON(saveFilePath, await this.makeSnapshot());
  }

  private async makeSnapshot(): Promise<Snapshot> {
    const artifacts: BuildInfoData[] = [];
    const paths = await this.hre_.artifacts.getBuildInfoPaths();

    const inheritanceParser = new InheritanceParser();
    for (const path of paths) {
      const contract = require(path) as BuildInfo;

      inheritanceParser.analyzeInheritanceImpact(contract);
      artifacts.push(ParseBuildInfo(contract));
    }

    return {
      buildInfos: artifacts,
      inheritanceImpact: inheritanceParser.result,
    };
  }

  private resolvePathToFile(path_: string, file_: string = ""): string {
    return path.normalize(path.join(fs.realpathSync(path_), file_));
  }
}
