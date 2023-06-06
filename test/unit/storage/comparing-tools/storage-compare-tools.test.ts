import { assert, expect } from "chai";
import { BuildInfo } from "hardhat/types";
import { StorageCompareTools } from "../../../../src/storage/comparing-tools/storage-compare-tools";
import { ParseBuildInfo } from "../../../../src/storage/parsers/parsers";
import {
  ChangeType,
  CompareData,
  StorageChangeData,
  StorageLayoutEntry,
  TypeChangeData,
} from "../../../../src/storage/types";
import { useEnvironment } from "../../../helpers";

describe("StorageCompareTools", () => {
  useEnvironment("hardhat-project");

  describe("compareNormContractStorage", () => {
    it("should not detect changes for equals layout", async function () {
      const storageCompareTools = new StorageCompareTools();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const contractStorageLayout = buildInfoData.contracts.find(
        (contract) => contract.name === "D" && contract.source === "contracts/D.sol"
      )!!.entries;

      storageCompareTools.compareNormContractStorage(contractStorageLayout, contractStorageLayout);

      assert.equal(storageCompareTools.result["contracts/D.sol:D"].size, 0);
    });

    it("should detect 'New storage layout entry' for different layout", async function () {
      const storageCompareTools = new StorageCompareTools();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const contractStorageLayoutD = buildInfoData.contracts.find(
        (contract) => contract.name === "D" && contract.source === "contracts/D.sol"
      )!!.entries;

      const contractStorageLayoutC = buildInfoData.contracts.find(
        (contract) => contract.name === "C" && contract.source === "contracts/C.sol"
      )!!.entries;

      storageCompareTools.compareNormContractStorage(contractStorageLayoutC, contractStorageLayoutD);

      assert.equal(storageCompareTools.result["contracts/C.sol:C"].size, 0);

      assert.equal(storageCompareTools.result["contracts/D.sol:D"].size, 2);

      const expected: Set<CompareData> = new Set([
        {
          changeType: ChangeType.NewStorageEntry,
          message: "Warning! New storage layout entry: label b of t_uint256 type in the latest snapshot!",
        },

        {
          changeType: ChangeType.NewStorageEntry,
          message: "Warning! New storage layout entry: label d of t_uint256 type in the latest snapshot!",
        },
      ]);

      assert.deepEqual(storageCompareTools.result["contracts/D.sol:D"], expected);
    });

    it("should detect 'Missed storage layout entry' for different layout", async function () {
      const storageCompareTools = new StorageCompareTools();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const contractStorageLayoutD = buildInfoData.contracts.find(
        (contract) => contract.name === "D" && contract.source === "contracts/D.sol"
      )!!.entries;

      const contractStorageLayoutC = buildInfoData.contracts.find(
        (contract) => contract.name === "C" && contract.source === "contracts/C.sol"
      )!!.entries;

      storageCompareTools.compareNormContractStorage(contractStorageLayoutD, contractStorageLayoutC);

      assert.equal(storageCompareTools.result["contracts/D.sol:D"].size, 2);

      const expected: Set<CompareData> = new Set([
        {
          changeType: ChangeType.MissedStorageEntry,
          message: "Missed storage layout entry: label b of t_uint256 type in the latest snapshot!",
        },

        {
          changeType: ChangeType.MissedStorageEntry,
          message: "Missed storage layout entry: label d of t_uint256 type in the latest snapshot!",
        },
      ]);

      assert.deepEqual(storageCompareTools.result["contracts/D.sol:D"], expected);
    });

    it("should detect 'slot' for different layout", async function () {
      const storageCompareTools = new StorageCompareTools();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const contractStorageLayoutD = buildInfoData.contracts.find(
        (contract) => contract.name === "D" && contract.source === "contracts/D.sol"
      )!!.entries;

      const contractStorageLayoutDWithChangedSlot = {
        ...contractStorageLayoutD,
        storage: contractStorageLayoutD.storage.map((entry) => {
          return {
            ...entry,
            slot: entry.slot + 1,
          };
        }),
      };

      storageCompareTools.compareNormContractStorage(contractStorageLayoutD, contractStorageLayoutDWithChangedSlot);

      const expected: Set<CompareData> = new Set(
        contractStorageLayoutD.storage.map((entry) => {
          const expectedStorageChangeData: StorageChangeData = {};
          expectedStorageChangeData.slot = [entry.slot, entry.slot + 1];
          return {
            changeType: ChangeType.StorageChange,
            storageChangeData: expectedStorageChangeData,
          };
        })
      );

      assert.equal(storageCompareTools.result["contracts/D.sol:D"].size, 4);

      assert.deepEqual(storageCompareTools.result["contracts/D.sol:D"], expected);
    });

    it("should detect 'offset' for different layout", async function () {
      const storageCompareTools = new StorageCompareTools();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const contractStorageLayoutD = buildInfoData.contracts.find(
        (contract) => contract.name === "D" && contract.source === "contracts/D.sol"
      )!!.entries;

      const contractStorageLayoutDWithChangedOffset = {
        ...contractStorageLayoutD,
        storage: contractStorageLayoutD.storage.map((entry) => {
          return {
            ...entry,
            offset: entry.offset + 1,
          };
        }),
      };

      storageCompareTools.compareNormContractStorage(contractStorageLayoutD, contractStorageLayoutDWithChangedOffset);

      const expected: Set<CompareData> = new Set(
        contractStorageLayoutD.storage.map((entry) => {
          const expectedStorageChangeData: StorageChangeData = {};
          expectedStorageChangeData.offset = [entry.offset, entry.offset + 1];
          return {
            changeType: ChangeType.StorageChange,
            storageChangeData: expectedStorageChangeData,
          };
        })
      );

      assert.equal(storageCompareTools.result["contracts/D.sol:D"].size, 4);

      assert.deepEqual(storageCompareTools.result["contracts/D.sol:D"], expected);
    });

    it("should detect 'label' for different layout", async function () {
      const storageCompareTools = new StorageCompareTools();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const contractStorageLayoutD = buildInfoData.contracts.find(
        (contract) => contract.name === "D" && contract.source === "contracts/D.sol"
      )!!.entries;

      const contractStorageLayoutDWithChangedLabel = {
        ...contractStorageLayoutD,
        storage: contractStorageLayoutD.storage.map((entry) => {
          return {
            ...entry,
            label: entry.label + "_changed",
          };
        }),
      };

      storageCompareTools.compareNormContractStorage(contractStorageLayoutD, contractStorageLayoutDWithChangedLabel);

      const expected: Set<CompareData> = new Set(
        contractStorageLayoutD.storage.map((entry) => {
          const expectedStorageChangeData: StorageChangeData = {};
          expectedStorageChangeData.label = [entry.label, entry.label + "_changed"];
          return {
            changeType: ChangeType.StorageChange,
            storageChangeData: expectedStorageChangeData,
          };
        })
      );

      assert.equal(storageCompareTools.result["contracts/D.sol:D"].size, 4);

      assert.deepEqual(storageCompareTools.result["contracts/D.sol:D"], expected);
    });

    it("should detect 'type' for different layout", async function () {
      const storageCompareTools = new StorageCompareTools();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const contractStorageLayoutD = buildInfoData.contracts.find(
        (contract) => contract.name === "D" && contract.source === "contracts/D.sol"
      )!!.entries;

      const contractStorageLayoutDWithChangedType: StorageLayoutEntry = {
        ...contractStorageLayoutD,
        storage: contractStorageLayoutD.storage.map((entry) => {
          return {
            ...entry,
            type: "t_uint32",
          };
        }),
        types: {
          ...contractStorageLayoutD.types,
          t_uint32: {
            encoding: "inplace",
            label: "uint32",
            numberOfBytes: "32",
          },
        },
      };

      storageCompareTools.compareNormContractStorage(contractStorageLayoutD, contractStorageLayoutDWithChangedType);

      const expected: Set<CompareData> = new Set(
        contractStorageLayoutD.storage.map((entry) => {
          const expectedStorageChangeData: StorageChangeData = {};
          expectedStorageChangeData.type = [entry.type, "t_uint32"];
          return {
            changeType: ChangeType.StorageChange,
            storageChangeData: expectedStorageChangeData,
          };
        })
      );

      assert.equal(storageCompareTools.result["contracts/D.sol:D"].size, 8);

      expect(Object.values(storageCompareTools.result["contracts/D.sol:D"])).like(Object.values(expected));
    });

    it("should detect 'label' for different layout data types", async function () {
      const storageCompareTools = new StorageCompareTools();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const contractStorageLayoutD = buildInfoData.contracts.find(
        (contract) => contract.name === "D" && contract.source === "contracts/D.sol"
      )!!.entries;

      const contractStorageLayoutDWithChangedTypeLabel: StorageLayoutEntry = {
        ...contractStorageLayoutD,
        types: {
          t_uint256: { ...contractStorageLayoutD.types.t_uint256, label: "uint256_changed" },
        },
      };

      storageCompareTools.compareNormContractStorage(
        contractStorageLayoutD,
        contractStorageLayoutDWithChangedTypeLabel
      );

      const expectedTypeChangeData: TypeChangeData = {
        label: [Object.values(contractStorageLayoutD.types)[0].label, "uint256_changed"],
      };
      const expected: Set<CompareData> = new Set([
        { changeType: ChangeType.StorageChange, typeChangeData: expectedTypeChangeData },
        { changeType: ChangeType.StorageChange, typeChangeData: expectedTypeChangeData },
        { changeType: ChangeType.StorageChange, typeChangeData: expectedTypeChangeData },
        { changeType: ChangeType.StorageChange, typeChangeData: expectedTypeChangeData },
      ]);

      assert.equal(storageCompareTools.result["contracts/D.sol:D"].size, 4);

      assert.deepEqual(storageCompareTools.result["contracts/D.sol:D"], expected);
    });

    it("should detect 'encoding' for different layout data types", async function () {
      const storageCompareTools = new StorageCompareTools();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const contractStorageLayoutD = buildInfoData.contracts.find(
        (contract) => contract.name === "D" && contract.source === "contracts/D.sol"
      )!!.entries;

      const contractStorageLayoutDWithChangedTypeEncoding: StorageLayoutEntry = {
        ...contractStorageLayoutD,
        types: {
          t_uint256: { ...contractStorageLayoutD.types.t_uint256, encoding: "changed" },
        },
      };

      storageCompareTools.compareNormContractStorage(
        contractStorageLayoutD,
        contractStorageLayoutDWithChangedTypeEncoding
      );

      const expectedTypeChangeData: TypeChangeData = {
        encoding: [Object.values(contractStorageLayoutD.types)[0].encoding, "changed"],
      };
      const expected: Set<CompareData> = new Set([
        { changeType: ChangeType.StorageChange, typeChangeData: expectedTypeChangeData },
        { changeType: ChangeType.StorageChange, typeChangeData: expectedTypeChangeData },
        { changeType: ChangeType.StorageChange, typeChangeData: expectedTypeChangeData },
        { changeType: ChangeType.StorageChange, typeChangeData: expectedTypeChangeData },
      ]);

      assert.equal(storageCompareTools.result["contracts/D.sol:D"].size, 4);

      assert.deepEqual(storageCompareTools.result["contracts/D.sol:D"], expected);
    });

    it("should detect 'numberOfBytes' for different layout data types", async function () {
      const storageCompareTools = new StorageCompareTools();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/D.sol:D");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const contractStorageLayoutD = buildInfoData.contracts.find(
        (contract) => contract.name === "D" && contract.source === "contracts/D.sol"
      )!!.entries;

      const contractStorageLayoutDWithChangedTypeEncoding: StorageLayoutEntry = {
        ...contractStorageLayoutD,
        types: {
          t_uint256: { ...contractStorageLayoutD.types.t_uint256, numberOfBytes: "changed" },
        },
      };

      storageCompareTools.compareNormContractStorage(
        contractStorageLayoutD,
        contractStorageLayoutDWithChangedTypeEncoding
      );

      const expectedTypeChangeData: TypeChangeData = {
        numberOfBytes: [Object.values(contractStorageLayoutD.types)[0].numberOfBytes, "changed"],
      };
      const expected: Set<CompareData> = new Set([
        { changeType: ChangeType.StorageChange, typeChangeData: expectedTypeChangeData },
        { changeType: ChangeType.StorageChange, typeChangeData: expectedTypeChangeData },
        { changeType: ChangeType.StorageChange, typeChangeData: expectedTypeChangeData },
        { changeType: ChangeType.StorageChange, typeChangeData: expectedTypeChangeData },
      ]);

      assert.equal(storageCompareTools.result["contracts/D.sol:D"].size, 4);

      assert.deepEqual(storageCompareTools.result["contracts/D.sol:D"], expected);
    });

    it("should detect struct changes", async function () {
      const storageCompareTools = new StorageCompareTools();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/WithStruct.sol:WithStruct");

      const buildInfoData = ParseBuildInfo(buildInfo);

      const contractStorageLayoutWithStruct = buildInfoData.contracts.find(
        (contract) => contract.name === "WithStruct" && contract.source === "contracts/WithStruct.sol"
      )!!.entries;

      storageCompareTools.compareNormContractStorage(contractStorageLayoutWithStruct, contractStorageLayoutWithStruct);

      assert.equal(storageCompareTools.result["contracts/WithStruct.sol:WithStruct"].size, 0);
    });

    it("should detect new struct fields", async function () {
      const storageCompareTools = new StorageCompareTools();

      const buildInfo: BuildInfo = await this.hre.artifacts.getBuildInfo("contracts/WithStruct.sol:WithStruct");
      const buildInfoData = ParseBuildInfo(buildInfo);
      const contractStorageLayoutWithStruct = buildInfoData.contracts.find(
        (contract) => contract.name === "WithStruct" && contract.source === "contracts/WithStruct.sol"
      )!!.entries;

      const buildInfoWithNewField: BuildInfo = await this.hre.artifacts.getBuildInfo(
        "contracts/WithStructUpdated.sol:WithStructUpdated"
      );
      const buildInfoDataWithNewField = ParseBuildInfo(buildInfoWithNewField);
      const contractStorageLayoutWithStructWithNewField = buildInfoDataWithNewField.contracts.find(
        (contract) => contract.name === "WithStructUpdated" && contract.source === "contracts/WithStructUpdated.sol"
      )!!.entries;

      storageCompareTools.compareNormContractStorage(
        contractStorageLayoutWithStruct,
        contractStorageLayoutWithStructWithNewField
      );

      assert.equal(storageCompareTools.result["contracts/WithStruct.sol:WithStruct"].size, 2);

      const expected: Set<CompareData> = new Set([
        {
          changeType: ChangeType.StorageChange,
          storageChangeData: { type: ["t_struct(S)36_storage", "t_struct(S)47_storage"] },
        },
        {
          changeType: ChangeType.StorageChange,
          typeChangeData: { label: ["struct WithStruct.S", "struct WithStructUpdated.S"], numberOfBytes: ["32", "64"] },
        },
      ]);

      assert.deepEqual(storageCompareTools.result["contracts/WithStruct.sol:WithStruct"], expected);

      assert.equal(storageCompareTools.result["contracts/WithStructUpdated.sol:WithStructUpdated"].size, 1);

      const expected2: Set<CompareData> = new Set([
        {
          changeType: ChangeType.NewStorageEntry,
          message: "New storage layout entry in struct: label value2 of t_uint256 type in the latest snapshot!",
        },
      ]);

      assert.deepEqual(storageCompareTools.result["contracts/WithStructUpdated.sol:WithStructUpdated"], expected2);
    });
  });
});
