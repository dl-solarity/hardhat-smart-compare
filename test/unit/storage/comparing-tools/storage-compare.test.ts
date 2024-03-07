import { BuildInfo } from "hardhat/types";
import { StorageCompare } from "../../../../src/storage/comparing-tools/StorageCompare";
import { ParseBuildInfo } from "../../../../src/storage/parsers/parsers";
import { useEnvironment } from "../../../helpers";

describe("StorageCompare", () => {
  useEnvironment("hardhat-project");

  describe("compareBuildInfos", () => {
    it("should return an array of two CompareInfo objects", async function () {
      const storageCompare = new StorageCompare();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const [old, latest] = storageCompare.compareBuildInfos([buildInfoData], [buildInfoData]);
    });
  });

  describe("compareContractStorageLayouts", () => {
    it("should return an array of two CompareInfo objects", async function () {
      const storageCompare = new StorageCompare();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const contractStorageLayout = buildInfoData.contracts.find(
        (contract) => contract.name === "D" && contract.source === "contracts/D.sol",
      )!!;

      const [old, latest] = storageCompare.compareContractStorageLayouts(
        [contractStorageLayout],
        [contractStorageLayout],
      );
    });
  });
});
