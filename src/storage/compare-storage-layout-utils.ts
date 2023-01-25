import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";

import {
  BuildInfoData,
  ChangeType,
  CompareData,
  CompareInfo,
  ContractStorageLayout,
  EmptyStorageChangeData,
  EmptyTypeChangeData,
  StorageChangeData,
  StorageEntry,
  StorageLayoutEntry,
  TypeChangeData,
  TypeEntries,
} from "./types";
import { isInContracts, mergeBuildInfos, removeStorageEntry } from "./utils";

import isEqual from "lodash.isequal";

export class StorageCompare {
  private result: CompareInfo = {};
  private oldPool: ContractStorageLayout[] = [];
  private latestPool: ContractStorageLayout[] = [];

  compareBuildInfos(oldSnapshot: BuildInfoData[], newSnapshot: BuildInfoData[]): CompareInfo {
    const [oldContracts, latestContracts] = mergeBuildInfos(oldSnapshot, newSnapshot);

    return this.compareContractStorageLayouts(oldContracts, latestContracts);
  }

  compareContractStorageLayouts(old: ContractStorageLayout[], latest: ContractStorageLayout[]): CompareInfo {
    const [normalizedOld, normalizedLatest] = this.normalizeContracts(old, latest);

    for (let i = 0; i < normalizedOld.length; i++) {
      this.compareStorageLayoutEntries(normalizedOld[i].entries, normalizedLatest[i].entries);
    }

    this.solveConflicts();

    return this.result;
  }

  private solveConflicts() {
    if (this.oldPool.length === 0 && this.latestPool.length === 0) {
      return;
    }

    const infoField = "Informational Data!";
    if (this.result[infoField] === undefined) {
      this.result[infoField] = new Set<CompareData>();
    }

    if (this.oldPool.length === 0) {
      for (const contract of this.latestPool) {
        const msg = `Added new contract: ${contract.source}:${contract.name}\n`;
        this.result[infoField].add({
          changeType: ChangeType.NewContract,
          message: msg,
        });
      }

      return;
    }

    if (this.latestPool.length === 0) {
      for (const contract of this.oldPool) {
        const msg = `Deleted contract: ${contract.source}:${contract.name}\n`;
        this.result[infoField].add({
          changeType: ChangeType.RemovedContract,
          message: msg,
        });
      }

      return;
    }

    for (const oldEntry of this.oldPool) {
      let isMatched = false;
      let nameToDelete = "";

      for (const latestEntry of this.latestPool) {
        const oldContractName = `${oldEntry.source}:${oldEntry.name}`;
        const latestContractName = `${latestEntry.source}:${latestEntry.name}`;

        if (this.result[oldContractName] === undefined) {
          this.result[oldContractName] = new Set<CompareData>();
        }

        if (this.result[latestContractName] === undefined) {
          this.result[latestContractName] = new Set<CompareData>();
        }

        this.compareStorageLayoutEntries(oldEntry.entries, latestEntry.entries);

        if (this.result[oldContractName].size > 0 || this.result[latestContractName].size > 0) {
          this.result[oldContractName].clear();
          this.result[latestContractName].clear();
          continue;
        }

        this.result[infoField].add({
          changeType: ChangeType.RenamedContract,
          message: `Renamed contract from ${oldContractName} to ${latestContractName}`,
        });

        isMatched = true;
        oldEntry.name = "1_Matched!";
        nameToDelete = latestContractName;

        break;
      }

      if (isMatched) {
        this.latestPool = removeStorageEntry(this.latestPool, nameToDelete);
      }
    }

    for (const contract of this.oldPool) {
      if (contract.name !== "1_Matched!") {
        this.result[infoField].add({
          changeType: ChangeType.RemovedContract,
          message: `Deleted contract: ${contract.source}:${contract.name}`,
        });
      }
    }

    for (const contract of this.latestPool) {
      this.result[infoField].add({
        changeType: ChangeType.NewContract,
        message: `Added new contract: ${contract.source}:${contract.name}`,
      });
    }
  }

  private normalizeContracts(old: ContractStorageLayout[], latest: ContractStorageLayout[]) {
    const filteredArray = old.filter((old) => isInContracts(latest, old));

    let normalizedLatest: ContractStorageLayout[] = [];
    let normalizedOld: ContractStorageLayout[] = [];

    if (filteredArray.length != old.length) {
      for (const entry of old) {
        if (!isInContracts(filteredArray, entry)) {
          this.oldPool.push(entry);
          continue;
        }

        normalizedOld.push(entry);
      }
    } else {
      normalizedOld = old;
    }

    if (filteredArray.length != latest.length) {
      for (const entry of latest) {
        if (!isInContracts(filteredArray, entry)) {
          this.latestPool.push(entry);
          continue;
        }

        normalizedLatest.push(entry);
      }
    } else {
      normalizedLatest = latest;
    }

    return [
      normalizedOld.sort((a, b) => (a.source + ":" + a.name).localeCompare(b.source + ":" + b.name)),
      normalizedLatest.sort((a, b) => (a.source + ":" + a.name).localeCompare(b.source + ":" + b.name)),
    ];
  }

  private compareStorageLayoutEntries(old: StorageLayoutEntry, latest: StorageLayoutEntry) {
    for (const index in old.storage) {
      if (this.compareStorageEntries(old.storage[index].contract, old.storage[index], latest.storage[index]) === -1) {
        continue;
      }

      this.compareTypeEntries(
        old.storage[index].type,
        latest.storage[index].type,
        old.types,
        latest.types,
        latest.storage[index].contract,
        old.storage[index].slot
      );
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

  private compareTypeEntries(
    oldType: string,
    latestType: string,
    oldTypes: TypeEntries,
    latestTypes: TypeEntries,
    contractName: string,
    slot: string
  ) {
    const oldTypeEntry = oldTypes[oldType];
    const latestTypeEntry = latestTypes[latestType];

    if (this.result[contractName] === undefined) {
      this.result[contractName] = new Set<CompareData>();
    }

    const changes: TypeChangeData = EmptyTypeChangeData;

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
        if (
          this.compareStorageEntries(
            oldTypeEntry.members[index].contract,
            oldTypeEntry.members[index],
            latestTypeEntry.members[index]
          ) === -1
        ) {
          continue;
        }

        this.compareTypeEntries(
          oldTypeEntry.members[index].type,
          latestTypeEntry.members[index].type,
          oldTypes,
          latestTypes,
          contractName,
          slot
        );
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
      this.compareTypeEntries(oldTypeEntry.value, latestTypeEntry.value, oldTypes, latestTypes, contractName, slot);
    }

    if (oldTypeEntry.base !== undefined && latestTypeEntry.base !== undefined) {
      this.compareTypeEntries(oldTypeEntry.base, latestTypeEntry.base, oldTypes, latestTypes, contractName, slot);
    }
  }

  private compareStorageEntries(contractName: string, old: StorageEntry, latest: StorageEntry) {
    if (old === undefined) {
      throw new NomicLabsHardhatPluginError(pluginName, "Unintended logic!\n" + "Report a bug, please!");
    }

    if (this.result[contractName] === undefined) {
      this.result[contractName] = new Set<CompareData>();
    }

    if (latest === undefined) {
      this.result[contractName].add({
        changeType: ChangeType.MissedStorageEntry,
        message: `Missed storage layout entry: label ${old.label} of ${old.type} type in the latest snapshot!`,
      });

      return -1;
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

    return 0;
  }
}
