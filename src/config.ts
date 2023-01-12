import { ConfigExtender, HardhatRuntimeEnvironment } from "hardhat/types";
import { CompareArgs } from "./types";

export const compareConfigExtender: ConfigExtender = (resolvedConfig, config) => {
  const defaultConfig = {
    snapshotPath: "./storage_snapshots",
  };

  if (config.compare !== undefined) {
    const { cloneDeep } = require("lodash");
    const customConfig = cloneDeep(config.compare);

    resolvedConfig.compare = { ...defaultConfig, ...customConfig };
  } else {
    resolvedConfig.compare = defaultConfig;
  }

  for (let compiler of resolvedConfig.solidity.compilers) {
    compiler.settings.outputSelection["*"]["*"].push("storageLayout");
  }
};

export function mergeCompareArgs(hre_: HardhatRuntimeEnvironment, args: CompareArgs) {
  if (args.snapshotPath !== undefined) {
    hre_.config.compare.snapshotPath = args.snapshotPath;
  }
}
