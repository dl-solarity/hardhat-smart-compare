import { ConfigExtender, HardhatConfig, HardhatRuntimeEnvironment, HardhatUserConfig } from "hardhat/types";

import { CompareArgs } from "./types";

export const compareConfigExtender: ConfigExtender = (
  config: HardhatConfig,
  userConfig: Readonly<HardhatUserConfig>,
) => {
  const defaultConfig = {
    snapshotPath: "./storage_snapshots",
    snapshotFileName: "storage_snapshot.json",
  };

  if (userConfig.compare !== undefined) {
    const { cloneDeep } = require("lodash");
    const customConfig = cloneDeep(config.compare);

    config.compare = { ...defaultConfig, ...customConfig };
  } else {
    config.compare = defaultConfig;
  }

  if (config.solidity !== undefined && config.solidity.compilers !== undefined) {
    for (let compiler of config.solidity.compilers) {
      compiler.settings.outputSelection["*"]["*"].push("storageLayout");
    }
  }
};

export function mergeCompareArgs(hre_: HardhatRuntimeEnvironment, args: CompareArgs) {
  if (args.snapshotPath !== undefined) {
    hre_.config.compare.snapshotPath = args.snapshotPath;
  }

  if (args.snapshotFileName !== undefined) {
    hre_.config.compare.snapshotFileName = args.snapshotFileName;
  }

  if (args.savedSpPath !== undefined) {
    hre_.config.compare.snapshotPath = args.savedSpPath;
  }

  if (args.savedSpName !== undefined) {
    hre_.config.compare.snapshotFileName = args.savedSpName;
  }
}
