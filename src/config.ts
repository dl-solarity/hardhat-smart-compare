import { ConfigExtender, HardhatRuntimeEnvironment, SolcConfig, SolcUserConfig } from "hardhat/types";
import { CompareArgs } from "./types";

const defaultSolcOutputSelection = {
  "*": {
    "*": ["storageLayout"],
  },
};

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

  resolvedConfig.solidity.compilers.map(resolveCompiler);
};

function resolveCompiler(compiler: SolcUserConfig): SolcConfig {
  const resolved: SolcConfig = {
    version: compiler.version,
    settings: compiler.settings ?? {},
  };

  if (resolved.settings.outputSelection === undefined) {
    resolved.settings.outputSelection = {};
  }

  for (const [file, contractSelection] of Object.entries(defaultSolcOutputSelection)) {
    if (resolved.settings.outputSelection[file] === undefined) {
      resolved.settings.outputSelection[file] = {};
    }

    for (const [contract, outputs] of Object.entries(contractSelection)) {
      if (resolved.settings.outputSelection[file][contract] === undefined) {
        resolved.settings.outputSelection[file][contract] = [];
      }

      for (const output of outputs) {
        const includesOutput: boolean = resolved.settings.outputSelection[file][contract].includes(output);

        if (!includesOutput) {
          resolved.settings.outputSelection[file][contract].push(output);
        }
      }
    }
  }

  return resolved;
}

export function mergeCompareArgs(hre_: HardhatRuntimeEnvironment, args: CompareArgs) {
  if (args.snapshotPath !== undefined) {
    hre_.config.compare.snapshotPath = args.snapshotPath;
  }
}
