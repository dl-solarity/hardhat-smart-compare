import { assert, expect } from "chai";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";
import sinon from "sinon";
import { compareConfigExtender } from "../../src/config";
import { DlCompareUserConfig } from "../../src/types";

describe("Chain Config", () => {
  it("should extend the hardhat config with the user config", async () => {
    const hardhatConfig = {} as HardhatConfig;
    const userConfig: HardhatUserConfig = {
      compare: {
        snapshotPath: "./storage_snapshots",
        snapshotFileName: "storage_snapshot.json",
      },
    };
    const expected: DlCompareUserConfig = {
      snapshotPath: "./storage_snapshots",
      snapshotFileName: "storage_snapshot.json",
    };
    compareConfigExtender(hardhatConfig, userConfig);

    assert.deepEqual(hardhatConfig.compare, expected);
  });

  it("should set default values when user config is not provided", async () => {
    const hardhatConfig = {} as HardhatConfig;
    const userConfig: HardhatUserConfig = {};
    const expected: DlCompareUserConfig = {
      snapshotPath: "./storage_snapshots",
      snapshotFileName: "storage_snapshot.json",
    };
    compareConfigExtender(hardhatConfig, userConfig);

    assert.deepEqual(hardhatConfig.compare, expected);
  });
});
