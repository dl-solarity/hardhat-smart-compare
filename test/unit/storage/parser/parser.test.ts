import { assert, expect } from "chai";
import { BuildInfo } from "hardhat/types";
import { ParseBuildInfo } from "../../../../src/storage/parsers/parsers";
import { ContractStorageLayout } from "../../../../src/storage/types";
import { useEnvironment } from "../../../helpers";

describe("parser", () => {
  useEnvironment("hardhat-project");

  describe("ParseBuildInfo", () => {
    it("should correctly parse base fields of BuildInfoData", async function () {
      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const result = ParseBuildInfo(buildInfo);
      const expected: any = {
        format: buildInfo._format,
        solcVersion: buildInfo.solcVersion,
        solcLongVersion: buildInfo.solcLongVersion,
      };
      expect(result).like(expected);
    });
  });

  it("should correctly parse ContractStorageLayout of BuildInfoData", async function () {
    const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

    const result = ParseBuildInfo(buildInfo);

    const expected: any = {
      name: "D",
      source: "contracts/D.sol",
      entries: {
        storage: [
          {
            contract: "contracts/D.sol:D",
            label: "a",
            offset: 0,
            slot: "0",
            type: "t_uint256",
          },
          {
            contract: "contracts/D.sol:D",
            label: "c",
            offset: 0,
            slot: "1",
            type: "t_uint256",
          },
          {
            contract: "contracts/D.sol:D",
            label: "b",
            offset: 0,
            slot: "2",
            type: "t_uint256",
          },
          {
            contract: "contracts/D.sol:D",
            label: "d",
            offset: 0,
            slot: "3",
            type: "t_uint256",
          },
        ],
        types: {
          t_uint256: {
            encoding: "inplace",
            label: "uint256",
            numberOfBytes: "32",
          },
        },
      },
    };
    expect(result.contracts[3]).like(expected);
  });
});
