import { expect } from "chai";
import { TASK_STORAGE_COMPARE, TASK_STORAGE_SAVE } from "../../src/constants";
import { useEnvironment } from "../helpers";

import fs from "fs-extra";

describe("storage task", () => {
  useEnvironment("hardhat-project");

  beforeEach(function () {
    if (fs.existsSync(this.hre.config.compare.snapshotPath)) {
      fs.removeSync(this.hre.config.compare.snapshotPath);
    }
  });
  afterEach(function () {
    if (fs.existsSync(this.hre.config.compare.snapshotPath)) {
      fs.removeSync(this.hre.config.compare.snapshotPath);
    }
  });

  describe("storage:save", () => {
    it("should throw if snapshotPath is invalid", async function () {
      await expect(
        this.hre.run(TASK_STORAGE_SAVE, {
          snapshotPath: "\0\\/",
        })
      ).to.be.rejectedWith(
        `Could not create directory for storage layout snapshots: '${this.hre.config.compare.snapshotPath}'`
      );
    });
  });
});
