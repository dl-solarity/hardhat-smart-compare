import { assert, expect } from "chai";
import { StorageLayout } from "../../src/storage/StorageLayout";
import { useEnvironment } from "../helpers";

import fs from "fs-extra";
import sinon from "sinon";

import { CompareModes } from "../../src/types";

describe("StorageLayout", () => {
  useEnvironment("hardhat-project");

  // Is it possible to revert the changes made to the file system?
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

  describe("saveSnapshot", () => {
    it("should create a snapshot folder if it does not exist", async function () {
      const storageLayout = new StorageLayout(this.hre);

      assert.isFalse(fs.existsSync(this.hre.config.compare.snapshotPath));

      await storageLayout.saveSnapshot(this.hre.config.compare.snapshotFileName);

      assert.isTrue(fs.existsSync(this.hre.config.compare.snapshotPath));
    });

    it("should create a snapshot file", async function () {
      const storageLayout = new StorageLayout(this.hre);

      assert.isFalse(fs.existsSync(this.hre.config.compare.snapshotPath));

      await storageLayout.saveSnapshot(this.hre.config.compare.snapshotFileName);

      assert.isTrue(fs.existsSync(this.hre.config.compare.snapshotPath));
      assert.isTrue(
        fs.existsSync(this.hre.config.compare.snapshotPath + "/" + this.hre.config.compare.snapshotFileName),
      );
    });

    it("should make a snapshot of the storage layout", async function () {
      const storageLayout = new StorageLayout(this.hre);

      await storageLayout.saveSnapshot(this.hre.config.compare.snapshotFileName);

      const snapshot = JSON.parse(
        fs.readFileSync(this.hre.config.compare.snapshotPath + "/" + this.hre.config.compare.snapshotFileName, "utf8"),
      );

      assert.isObject(snapshot);
      assert.isArray(snapshot.buildInfos);
      assert.isObject(snapshot.inheritanceImpact);
    });
  });

  describe("compareSnapshots", () => {
    it("should throw if snapshotPath is invalid", async function () {
      const storageLayout = new StorageLayout(this.hre);

      await expect(
        storageLayout.compareSnapshots(this.hre.config.compare.snapshotFileName, CompareModes.STRICT, true),
      ).to.be.rejectedWith(`Could not find directory for storage layout snapshots!`);
    });

    it("should throw if fileName is invalid", async function () {
      const storageLayout = new StorageLayout(this.hre);

      await storageLayout.saveSnapshot(this.hre.config.compare.snapshotFileName);

      expect(storageLayout.compareSnapshots("bla", CompareModes.STRICT, true)).to.be.rejectedWith(
        `Could not find saved snapshot of the storage layout!`,
      );
    });

    it("should print a message if the current snapshot is equal to the saved one", async function () {
      const storageLayout = new StorageLayout(this.hre);

      await storageLayout.saveSnapshot(this.hre.config.compare.snapshotFileName);

      let spy = sinon.spy(console, "info");
      await storageLayout.compareSnapshots(this.hre.config.compare.snapshotFileName, CompareModes.STRICT, true);
      assert.isTrue(spy.calledWith("Current snapshot is equal to the current version of contracts!"));

      spy.restore();
    });
  });
});

describe("compareSnapshots *with differences*", () => {
  useEnvironment("hardhat-project-with-existing-snapshot");

  it("should print a message if the current snapshot is equal to the saved one", async function () {
    const storageLayout = new StorageLayout(this.hre);

    let spy = sinon.spy(console, "info");
    await storageLayout.compareSnapshots(this.hre.config.compare.snapshotFileName, CompareModes.NONE, true);
    assert.isFalse(spy.calledWith("Current snapshot is equal to the current version of contracts!"));

    spy.restore();
  });
});
