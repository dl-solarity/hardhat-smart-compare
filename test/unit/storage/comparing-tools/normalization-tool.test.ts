import { assert } from "chai";
import { BuildInfo } from "hardhat/types";
import { NormalizationTools } from "../../../../src/storage/comparing-tools/NormalizationTools";
import { ParseBuildInfo } from "../../../../src/storage/parsers/parsers";
import { useEnvironment } from "../../../helpers";

describe("NormalizationTools", () => {
  useEnvironment("hardhat-project");

  describe("normalizeContracts", () => {
    it("should return normalized layout", async function () {
      const normalizationTools = new NormalizationTools();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const contractStorageLayout = buildInfoData.contracts.find(
        (contract) => contract.name === "D" && contract.source === "contracts/D.sol",
      )!!;

      const [old, latest] = normalizationTools.normalizeContracts([contractStorageLayout], [contractStorageLayout]);

      assert.deepEqual(old, latest);
    });
  });
});
