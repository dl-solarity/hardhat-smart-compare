import { assert, expect } from "chai";
import {
  findContract,
  getContractFullName,
  isInContracts,
  parseContractStorageLayout,
  removeStorageEntry,
} from "../../../../src/storage/comparing-tools/utils";
import { useEnvironment } from "../../../helpers";

describe("utils", () => {
  useEnvironment("hardhat-project");

  describe("getContractFullName", () => {
    it("should return the full contract name divided by :", () => {
      assert.equal(getContractFullName({ name: "a", source: "b" } as any), "b:a");
    });
  });

  describe("removeStorageEntry", () => {
    it("should remove the entry from the array", () => {
      const arr = [{ name: "a", source: "b" } as any, { name: "c", source: "d" } as any];
      const result = [{ name: "c", source: "d" } as any];
      assert.deepEqual(removeStorageEntry(arr, "b:a"), result);
    });
  });

  describe("findContract", () => {
    it("should return the index of the contract in the array", () => {
      const arr = [{ name: "a", source: "b" } as any, { name: "c", source: "d" } as any];
      assert.equal(findContract(arr, "a", "b"), 0);
      assert.equal(findContract(arr, "c", "d"), 1);
      assert.equal(findContract(arr, "bla", "bla"), -1);
    });
  });

  describe("isInContracts", () => {
    it("should return true if the contract is in the array", () => {
      const arr = [{ name: "a", source: "b" } as any, { name: "c", source: "d" } as any];
      const contract = { name: "a", source: "b" } as any;
      const anotherContract = { name: "bla", source: "bla" } as any;
      assert.isTrue(isInContracts(arr, contract));
      assert.isFalse(isInContracts(arr, anotherContract));
    });
  });

  describe("mergeBuildInfos", () => {
    it("should return an array of two ContractStorageLayout arrays", () => {
      const old = [{ contracts: [{ name: "a", source: "b" } as any] } as any];
      const latest = [{ contracts: [{ name: "c", source: "d" } as any] } as any];

      const mergedOld = [{ name: "a", source: "b" } as any];
      const mergedLatest = [{ name: "c", source: "d" } as any];

      assert.deepEqual(parseContractStorageLayout(old), mergedOld);
      assert.deepEqual(parseContractStorageLayout(latest), mergedLatest);
    });
  });
});
