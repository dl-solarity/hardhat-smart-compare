import "hardhat/types/config";

import { DlCompareConfig, DlCompareUserConfig } from "./types";

declare module "hardhat/types/config" {
  interface HardhatConfig {
    compare: DlCompareConfig;
  }

  interface HardhatUserConfig {
    compare?: DlCompareUserConfig;
  }
}
