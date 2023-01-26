import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../../constants";

import {
  ChangeType,
  CompareData,
  CompareInfo,
  EmptyStorageChangeData,
  EmptyTypeChangeData,
  StorageChangeData,
  StorageEntry,
  StorageLayoutEntry,
  TypeChangeData,
  TypeEntries,
} from "../types";

import isEqual from "lodash.isequal";

export class StorageCompareTools {
  public result: CompareInfo = {};
  private oldTypeEntries: TypeEntries = {};
  private latestTypeEntries: TypeEntries = {};

  compareNormContractStorage(old: StorageLayoutEntry, latest: StorageLayoutEntry) {
    this.oldTypeEntries = old.types;
    this.latestTypeEntries = latest.types;

    for (const index in old.storage) {
      this.compareTwoEntries(old.storage[index].contract, old.storage[index], latest.storage[index]);
    }

    if (old.storage.length < latest.storage.length) {
      for (const newEntry of latest.storage.slice(old.storage.length)) {
        const contractName = newEntry.contract;

        if (this.result[contractName] === undefined) {
          this.result[contractName] = new Set<CompareData>();
        }

        this.result[contractName].add({
          changeType: ChangeType.NewStorageEntry,
          message: `Warning! New storage layout entry: label ${newEntry.label} of ${newEntry.type} type in the latest snapshot!`,
        });
      }
    }
  }

  private compareTwoEntries(contractName: string, oldStorageEntry: StorageEntry, latestStorageEntry: StorageEntry) {
    if (!this.tryCompareStorageEntries(contractName, oldStorageEntry, latestStorageEntry)) {
      return;
    }

    this.compareTypeEntries(contractName, oldStorageEntry.type, latestStorageEntry.type);
  }

  private compareTypeEntries(contractName: string, oldType: string, latestType: string) {
    const changes: TypeChangeData = EmptyTypeChangeData;

    if (this.result[contractName] === undefined) {
      this.result[contractName] = new Set<CompareData>();
    }

    const oldTypeEntry = this.oldTypeEntries[oldType];
    const latestTypeEntry = this.latestTypeEntries[latestType];

    if (oldTypeEntry.label !== latestTypeEntry.label) {
      changes.label = [oldTypeEntry.label, latestTypeEntry.label];
    }

    if (oldTypeEntry.encoding !== latestTypeEntry.encoding) {
      changes.encoding = [oldTypeEntry.encoding, latestTypeEntry.encoding];
    }

    if (oldTypeEntry.numberOfBytes !== latestTypeEntry.numberOfBytes) {
      changes.numberOfBytes = [oldTypeEntry.numberOfBytes, latestTypeEntry.numberOfBytes];
    }

    if (!isEqual(changes, EmptyTypeChangeData)) {
      this.result[contractName].add({
        changeType: ChangeType.StorageChange,
        typeChangeData: changes,
      });
    }

    if (oldTypeEntry.members !== undefined && latestTypeEntry.members !== undefined) {
      for (const index in oldTypeEntry.members) {
        this.compareTwoEntries(contractName, oldTypeEntry.members[index], latestTypeEntry.members[index]);
      }

      if (oldTypeEntry.members.length < latestTypeEntry.members.length) {
        for (const newEntry of latestTypeEntry.members.slice(oldTypeEntry.members.length)) {
          const contractName = newEntry.contract;

          if (this.result[contractName] === undefined) {
            this.result[contractName] = new Set<CompareData>();
          }

          this.result[contractName].add({
            changeType: ChangeType.NewStorageEntry,
            message: `New storage layout entry in struct: label ${newEntry.label} of ${newEntry.type} type in the latest snapshot!`,
          });
        }
      }
    }

    if (oldTypeEntry.value !== undefined && latestTypeEntry.value !== undefined) {
      this.compareTypeEntries(contractName, oldTypeEntry.value, latestTypeEntry.value);
    }

    if (oldTypeEntry.base !== undefined && latestTypeEntry.base !== undefined) {
      this.compareTypeEntries(contractName, oldTypeEntry.base, latestTypeEntry.base);
    }
  }

  private tryCompareStorageEntries(contractName: string, old: StorageEntry, latest: StorageEntry) {
    if (latest === undefined) {
      this.result[contractName].add({
        changeType: ChangeType.MissedStorageEntry,
        message: `Missed storage layout entry: label ${old.label} of ${old.type} type in the latest snapshot!`,
      });

      return false;
    }

    if (old === undefined) {
      throw new NomicLabsHardhatPluginError(pluginName, "Unintended logic!\n" + "Report a bug, please!");
    }

    if (this.result[contractName] === undefined) {
      this.result[contractName] = new Set<CompareData>();
    }

    let changes: StorageChangeData = EmptyStorageChangeData;

    if (old.slot !== latest.slot) {
      changes.slot = [old.slot, latest.slot];
    }

    if (old.offset !== latest.offset) {
      changes.offset = [old.offset, latest.offset];
    }

    if (old.label !== latest.label) {
      changes.label = [old.label, latest.label];
    }

    if (old.type !== latest.type) {
      changes.type = [old.type, latest.type];
    }

    if (!isEqual(changes, EmptyStorageChangeData)) {
      this.result[contractName].add({
        changeType: ChangeType.StorageChange,
        storageChangeData: changes,
      });
    }

    return true;
  }
}
