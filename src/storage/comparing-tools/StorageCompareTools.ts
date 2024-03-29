import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../../constants";

import {
  ChangeType,
  CompareData,
  CompareInfo,
  StorageChangeData,
  StorageEntry,
  StorageLayoutEntry,
  TypeChangeData,
  TypeEntries,
} from "../types";

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
        this.addCompareData(contractName, {
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
    const changes: TypeChangeData = {};

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

    if (Object.keys(changes).length) {
      this.addCompareData(contractName, {
        changeType: ChangeType.StorageChange,
        typeChangeData: changes,
      });
    }

    if (oldTypeEntry.members && latestTypeEntry.members) {
      for (const index in oldTypeEntry.members) {
        this.compareTwoEntries(contractName, oldTypeEntry.members[index], latestTypeEntry.members[index]);
      }

      if (oldTypeEntry.members.length < latestTypeEntry.members.length) {
        for (const newEntry of latestTypeEntry.members.slice(oldTypeEntry.members.length)) {
          const contractName = newEntry.contract;

          this.addCompareData(contractName, {
            changeType: ChangeType.NewStorageEntry,
            message: `New storage layout entry in struct: label ${newEntry.label} of ${newEntry.type} type in the latest snapshot!`,
          });
        }
      }
    }

    if (oldTypeEntry.value && latestTypeEntry.value) {
      this.compareTypeEntries(contractName, oldTypeEntry.value, latestTypeEntry.value);
    }

    if (oldTypeEntry.base && latestTypeEntry.base) {
      this.compareTypeEntries(contractName, oldTypeEntry.base, latestTypeEntry.base);
    }
  }

  private tryCompareStorageEntries(contractName: string, old: StorageEntry, latest: StorageEntry) {
    if (!latest) {
      this.addCompareData(contractName, {
        changeType: ChangeType.MissedStorageEntry,
        message: `Missed storage layout entry: label ${old.label} of ${old.type} type in the latest snapshot!`,
      });

      return false;
    }

    if (!old) {
      throw new NomicLabsHardhatPluginError(pluginName, "Unintended logic!\n" + "Report a bug, please!");
    }

    let changes: StorageChangeData = {};

    if (old.slot !== latest.slot) {
      changes.slot = [old.slot, latest.slot];
    }

    if (old.offset !== latest.offset) {
      changes.offset = [old.offset, latest.offset];
    }

    if (old.label !== latest.label) {
      changes.label = [old.label, latest.label];
    }

    if (!this.isTypesEqual(contractName, old.type, latest.type) && old.type !== latest.type) {
      changes.type = [old.type, latest.type];
    }

    if (Object.keys(changes).length !== 0) {
      this.addCompareData(contractName, { changeType: ChangeType.StorageChange, storageChangeData: changes });
    }

    return true;
  }

  private addCompareData(contractName: string, compareData: CompareData) {
    this.result[contractName] ??= new Set<CompareData>();

    this.result[contractName].add(compareData);
  }

  private isTypesEqual(contractName: string, oldType: string, latestType: string): boolean {
    const oldTypeEntry = this.oldTypeEntries[oldType];
    const latestTypeEntry = this.latestTypeEntries[latestType];

    if (oldTypeEntry.label !== latestTypeEntry.label) {
      return false;
    }

    if (oldTypeEntry.encoding !== latestTypeEntry.encoding) {
      return false;
    }

    if (oldTypeEntry.numberOfBytes !== latestTypeEntry.numberOfBytes) {
      return false;
    }

    if (oldTypeEntry.members && latestTypeEntry.members) {
      if (oldTypeEntry.members.length < latestTypeEntry.members.length) {
        return false;
      }

      for (const index in oldTypeEntry.members) {
        if (!this.isStorageEntriesEqual(contractName, oldTypeEntry.members[index], latestTypeEntry.members[index])) {
          return false;
        }
      }
    }

    if (oldTypeEntry.value && latestTypeEntry.value) {
      return this.isTypesEqual(contractName, oldTypeEntry.value, latestTypeEntry.value);
    }

    if (oldTypeEntry.base && latestTypeEntry.base) {
      return this.isTypesEqual(contractName, oldTypeEntry.base, latestTypeEntry.base);
    }

    return true;
  }

  private isStorageEntriesEqual(
    contractName: string,
    oldStorageEntry: StorageEntry,
    latestStorageEntry: StorageEntry,
  ): boolean {
    if (!this.isEntriesEqual(contractName, oldStorageEntry, latestStorageEntry)) {
      return false;
    }

    return this.isTypesEqual(contractName, oldStorageEntry.type, latestStorageEntry.type);
  }

  private isEntriesEqual(contractName: string, old: StorageEntry, latest: StorageEntry): boolean {
    if (!latest) {
      this.addCompareData(contractName, {
        changeType: ChangeType.MissedStorageEntry,
        message: `Missed storage layout entry: label ${old.label} of ${old.type} type in the latest snapshot!`,
      });

      return false;
    }

    if (!old) {
      throw new NomicLabsHardhatPluginError(pluginName, "Unintended logic!\n" + "Report a bug, please!");
    }

    if (old.slot !== latest.slot) {
      return false;
    }

    if (old.offset !== latest.offset) {
      return false;
    }

    if (old.label !== latest.label) {
      return false;
    }

    if (!this.isTypesEqual(contractName, old.type, latest.type) && old.type !== latest.type) {
      return false;
    }

    return true;
  }
}
