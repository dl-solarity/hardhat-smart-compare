import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { BuildInfo, HardhatRuntimeEnvironment } from "hardhat/types";

import fs from "fs-extra";
import isEqual from "lodash.isequal";
import * as path from "path";

import { Printer } from "./Printer";

import { Snapshot } from "./types";
import { infoMessage } from "./constants";

import { ParseBuildInfo } from "./parsers/parsers";
import { InheritanceParser } from "./parsers/InheritanceParser";

import { isInfosContainsChanges } from "./comparing-tools/utils";
import { StorageCompare } from "./comparing-tools/StorageCompare";

import { CompareModes } from "../types";
import { pluginName } from "../constants";

export class StorageLayout {
  private snapshotPath_: string;

  constructor(private hre_: HardhatRuntimeEnvironment) {
    this.snapshotPath_ = hre_.config.compare.snapshotPath;
  }

  async compareSnapshots(fileName: string, mode: string, printDiff: boolean) {
    if (!fs.existsSync(this.snapshotPath_)) {
      throw new NomicLabsHardhatPluginError(pluginName, "Could not find directory for storage layout snapshots!");
    }
    const savedFilePath = this.resolvePathToFile(this.snapshotPath_, fileName);

    if (!fs.existsSync(savedFilePath)) {
      throw new NomicLabsHardhatPluginError(pluginName, "Could not find saved snapshot of the storage layout!");
    }

    const newSnapshot: Snapshot = await this.makeSnapshot();
    const oldSnapshot: Snapshot = require(savedFilePath);

    if (isEqual(oldSnapshot, newSnapshot)) {
      console.info("Current snapshot is equal to the current version of contracts!");
      return;
    }

    const comparisonResult = new StorageCompare().compareBuildInfos(oldSnapshot.buildInfos, newSnapshot.buildInfos);

    if (printDiff) {
      new Printer(...comparisonResult).print();
    }

    if (mode === CompareModes.STRICT) {
      throw new NomicLabsHardhatPluginError(
        pluginName,
        "Strict mode! Logic changes or storage layout changes detected!"
      );
    }

    if (!printDiff) {
      console.info(infoMessage);
    }

    if (mode === CompareModes.SOFT && isInfosContainsChanges(comparisonResult)) {
      throw new NomicLabsHardhatPluginError(pluginName, "Soft mode! Storage layout changes detected!");
    }
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
    const inheritanceParser = new InheritanceParser();

    const paths = await this.hre_.artifacts.getBuildInfoPaths();

    const artifacts = paths.map((path) => {
      const contract = require(path) as BuildInfo;
      inheritanceParser.analyzeInheritanceImpact(contract);
      return ParseBuildInfo(contract);
    });

    return {
      buildInfos: artifacts,
      inheritanceImpact: inheritanceParser.result,
    };
  }

  private resolvePathToFile(path_: string, file_: string = ""): string {
    return path.normalize(path.join(fs.realpathSync(path_), file_));
  }
}
