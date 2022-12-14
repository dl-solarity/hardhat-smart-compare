import { ConfigExtender } from "hardhat/types";

export const deployConfigExtender: ConfigExtender = (resolvedConfig, config) => {
  const defaultConfig = {};

  if (config.compare !== undefined) {
    const { cloneDeep } = require("lodash");
    const customConfig = cloneDeep(config.compare);

    resolvedConfig.compare = { ...defaultConfig, ...customConfig };
  } else {
    resolvedConfig.compare = defaultConfig;
  }
};
