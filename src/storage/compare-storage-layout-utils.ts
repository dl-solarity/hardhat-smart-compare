import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";

import {
  BuildInfoData,
  CompareInfo,
  ContractStorageLayout,
  StorageEntry,
  StorageLayoutEntry,
  TypeEntries,
} from "./types";
import { removeStorageEntry, isInContracts, mergeBuildInfos } from "./utils";

import chalk from "chalk";
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

    const infoField = "Conflicts!";
    if (this.result[infoField] === undefined) {
      this.result[infoField] = new Set<string>();
    }

    if (this.oldPool.length === 0) {
      for (const contract of this.latestPool) {
        const msg = `Added new contract: ${contract.source}:${contract.name}\n`;
        this.result[infoField].add(chalk.yellowBright(msg));
      }

      return;
    }

    if (this.latestPool.length === 0) {
      for (const contract of this.oldPool) {
        const msg = `Deleted contract: ${contract.source}:${contract.name}\n`;
        this.result[infoField].add(chalk.redBright(msg));
      }

      return;
    }

    let message = `Informational data:\n`;
    const startMsgLength = message.length;

    for (const oldEntry of this.oldPool) {
      let isMatched = false;
      let nameToDelete = "";

      for (const latestEntry of this.latestPool) {
        const oldContractName = `${oldEntry.source}:${oldEntry.name}`;
        const latestContractName = `${latestEntry.source}:${latestEntry.name}`;

        if (this.result[oldContractName] === undefined) {
          this.result[oldContractName] = new Set<string>();
        }

        if (this.result[latestContractName] === undefined) {
          this.result[latestContractName] = new Set<string>();
        }

        this.compareStorageLayoutEntries(oldEntry.entries, latestEntry.entries);

        if (this.result[oldContractName].size > 0 || this.result[latestContractName].size > 0) {
          this.result[oldContractName].clear();
          this.result[latestContractName].clear();
          continue;
        }

        message += `\tRenamed contract from ${oldContractName} to ${latestContractName}\n`;

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
        message += `\tCould not find a contract ${contract.source}:${contract.name} in the latest version of contracts!\n`;
      }
    }

    for (const contract of this.latestPool) {
      message += `\tCould not find a contract ${contract.source}:${contract.name} in the old version of contracts!\n`;
    }

    if (startMsgLength < message.length) {
      this.result[infoField].add(chalk.red(message));
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

    return [normalizedOld, normalizedLatest];
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
      for (const index in latest.storage.slice(old.storage.length)) {
        const contractName = latest.storage[index].contract;
        if (this.result[contractName] === undefined) {
          this.result[contractName] = new Set<string>();
        }

        const msg = `Warning! New storage layout entry: label ${latest.storage[index].label} of ${latest.storage[index].type} type in the latest snapshot!\n`;
        this.result[contractName].add(chalk.yellow(msg));
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
    if (oldType === latestType) {
      return;
    }

    const oldTypeEntry = oldTypes[oldType];
    const latestTypeEntry = latestTypes[latestType];

    if (isEqual(oldTypeEntry, latestTypeEntry)) {
      return;
    }

    if (this.result[contractName] === undefined) {
      this.result[contractName] = new Set<string>();
    }

    let message = `Latest variable with label ${latestTypeEntry.label} (slot ${slot}):\n`;
    const startMsgLength = message.length;

    if (oldTypeEntry.encoding !== latestTypeEntry.encoding) {
      message += `\tEncoding changed! Old encoding: ${oldTypeEntry.encoding} -> Latest encoding: ${latestTypeEntry.encoding}\n`;
    }

    if (oldTypeEntry.numberOfBytes !== latestTypeEntry.numberOfBytes) {
      message += `\tNumber of bytes changed! Old number of bytes: ${oldTypeEntry.numberOfBytes} -> Latest number of bytes: ${latestTypeEntry.numberOfBytes}\n`;
    }

    if (startMsgLength < message.length) {
      this.result[contractName].add(chalk.red(message));
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
        for (const index in latestTypeEntry.members.slice(oldTypeEntry.members.length)) {
          const contractName = latestTypeEntry.members[index].contract;
          if (this.result[contractName] === undefined) {
            this.result[contractName] = new Set<string>();
          }

          const msg = `New storage layout entry in struct: label ${latestTypeEntry.members[index].label} of ${latestTypeEntry.members[index].type} type in the latest snapshot!\n`;
          this.result[contractName].add(chalk.red(msg));
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
      this.result[contractName] = new Set<string>();
    }

    if (latest === undefined) {
      const msg = `Missed storage layout entry: label ${old.label} of ${old.type} type in the latest snapshot!\n`;
      this.result[contractName].add(chalk.red(msg));
      return -1;
    }

    let message = `Variable with label ${old.label} of ${old.type} type:\n`;
    const startMsgLength = message.length;

    if (old.slot !== latest.slot) {
      message += `\tSlot changed! Old slot: ${old.slot} -> Latest slot: ${latest.slot}\n`;
    }

    if (old.offset !== latest.offset) {
      message += `\tOffset changed!! Old offset: ${old.offset} -> Latest offset: ${latest.offset}\n`;
    }

    if (old.label !== latest.label) {
      message += `\tLabels changed! Old label: ${old.label} -> Latest label: ${latest.label}\n`;
    }

    if (startMsgLength < message.length) {
      this.result[contractName].add(chalk.red(message));
    }

    return 0;
  }
}
