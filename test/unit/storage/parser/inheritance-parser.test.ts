import { assert, expect } from "chai";
import { BuildInfo } from "hardhat/types";
import { InheritanceParser } from "../../../../src/storage/parsers/inheritance-parser";
import { useEnvironment } from "../../../helpers";

describe("InheritanceParser", () => {
  useEnvironment("hardhat-project");

  describe("extractInheritanceTree", () => {
    it("should return the inheritance mapping", async function () {
      const inheritanceParser = new InheritanceParser();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const result = inheritanceParser.extractInheritanceTree(buildInfo);
      expect(result).like({
        "contracts/A.sol:A": {
          linearizedBaseContracts: [],
        },
        "contracts/B.sol:B": {
          linearizedBaseContracts: ["contracts/A.sol:A"],
        },
        "contracts/C.sol:C": {
          linearizedBaseContracts: ["contracts/A.sol:A"],
        },
        "contracts/D.sol:D": {
          linearizedBaseContracts: ["contracts/B.sol:B", "contracts/C.sol:C", "contracts/A.sol:A"],
        },
      });
    });
  });

  describe("analyzeInheritanceImpact", () => {
    it("should return the inheritance impact", async function () {
      const inheritanceParser = new InheritanceParser();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      inheritanceParser.analyzeInheritanceImpact(buildInfo);

      expect(inheritanceParser.result).like({
        "contracts/B.sol:B": ["contracts/D.sol:D"],
        "contracts/A.sol:A": ["contracts/B.sol:B", "contracts/C.sol:C", "contracts/D.sol:D"],
        "contracts/C.sol:C": ["contracts/D.sol:D"],
      });
    });
  });
});
