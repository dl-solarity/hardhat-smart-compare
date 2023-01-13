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
import { RemoveStorageEntry, IsInContracts, MergeBuildInfos } from "./utils";

import chalk from "chalk";
import isEqual from "lodash.isequal";

export class StorageCompare {
  private result: CompareInfo = {};
  private oldPool: ContractStorageLayout[] = [];
  private latestPool: ContractStorageLayout[] = [];

  CompareBuildInfos(oldSnapshot: BuildInfoData[], newSnapshot: BuildInfoData[]): CompareInfo {
    const [oldContracts, latestContracts] = MergeBuildInfos(oldSnapshot, newSnapshot);

    return this.CompareContractStorageLayouts(oldContracts, latestContracts);
  }

  CompareContractStorageLayouts(old: ContractStorageLayout[], latest: ContractStorageLayout[]): CompareInfo {
    const [normalizedOld, normalizedLatest] = this.normalizeContracts(old, latest);

    for (let i = 0; i < normalizedOld.length; i++) {
      this.compareStorageLayoutEntries(normalizedOld[i].entries, normalizedLatest[i].entries);
    }

    this.SolveConflicts();

    return this.result;
  }

  private SolveConflicts() {
    if (this.oldPool.length === 0 && this.latestPool.length === 0) {
      return;
    }

    const infoField = "Conflicts!";
    if (this.result[infoField] === undefined) {
      this.result[infoField] = [];
    }

    if (this.oldPool.length === 0) {
      for (const contract of this.latestPool) {
        const msg = `Added new contract: ${contract.source}:${contract.name}`;
        this.result[infoField].push(chalk.yellowBright(msg));
      }

      return;
    }

    if (this.latestPool.length === 0) {
      for (const contract of this.oldPool) {
        const msg = `Deleted contract: ${contract.source}:${contract.name}`;
        this.result[infoField].push(chalk.redBright(msg));
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
          this.result[oldContractName] = [];
        }

        if (this.result[latestContractName] === undefined) {
          this.result[latestContractName] = [];
        }

        this.compareStorageLayoutEntries(oldEntry.entries, latestEntry.entries);

        if (this.result[oldContractName].length > 0 || this.result[latestContractName].length > 0) {
          this.result[oldContractName] = [];
          this.result[latestContractName] = [];
          continue;
        }

        const msg = `Renamed contract from ${oldContractName} to ${latestContractName}`;
        this.result[infoField].push(chalk.blue(msg));

        isMatched = true;
        oldEntry.name = "1_Matched!";
        nameToDelete = latestContractName;

        break;
      }

      if (isMatched) {
        this.latestPool = RemoveStorageEntry(this.latestPool, nameToDelete);
      }
    }

    for (const contract of this.oldPool) {
      if (contract.name !== "1_Matched!") {
        const msg = `Could not find a contract ${contract.source}:${contract.name} in the latest version of contracts!`;
        this.result[infoField].push(chalk.red(msg));
      }
    }

    for (const contract of this.latestPool) {
      const msg = `Could not find a contract ${contract.source}:${contract.name} in the old version of contracts!`;
      this.result[infoField].push(chalk.blue(msg));
    }
  }

  private normalizeContracts(old: ContractStorageLayout[], latest: ContractStorageLayout[]) {
    const filteredArray = old.filter((old) => {
      return IsInContracts(latest, old);
    });

    let normalizedLatest: ContractStorageLayout[] = [];
    let normalizedOld: ContractStorageLayout[] = [];

    if (filteredArray.length != old.length) {
      for (const entry of old) {
        if (!IsInContracts(filteredArray, entry)) {
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
        if (!IsInContracts(filteredArray, entry)) {
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
          this.result[contractName] = [];
        }

        const msg = `Warning! New storage layout entry: label ${latest.storage[index].label} of ${latest.storage[index].type} type in the latest snapshot!`;
        this.result[contractName].push(chalk.yellow(msg));
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
      this.result[contractName] = [];
    }

    if (oldTypeEntry.encoding !== latestTypeEntry.encoding) {
      const msg = `Encoding for latest label ${latestTypeEntry.label} (slot ${slot}) different! Old encoding: ${oldTypeEntry.encoding} -> Latest encoding: ${latestTypeEntry.encoding}`;
      this.result[contractName].push(chalk.red(msg));

      return;
    }

    if (oldTypeEntry.numberOfBytes !== latestTypeEntry.numberOfBytes) {
      const msg = `Number of bytes for latest label ${latestTypeEntry.label} (slot ${slot}) different! Old number of bytes: ${oldTypeEntry.numberOfBytes} -> Latest number of bytes: ${latestTypeEntry.numberOfBytes}`;
      this.result[contractName].push(chalk.red(msg));

      return;
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
            this.result[contractName] = [];
          }

          const msg = `New storage layout entry in struct: label ${oldTypeEntry.members[index].label} of ${oldTypeEntry.members[index].type} type in the latest snapshot!`;
          this.result.messages.push(chalk.red(msg));
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
      this.result[contractName] = [];
    }

    if (latest === undefined) {
      const msg = `Missed storage layout entry: label ${old.label} of ${old.type} type in the latest snapshot!`;
      this.result[contractName].push(chalk.red(msg));
      return -1;
    }

    if (old.slot !== latest.slot) {
      const msg = `Different slots for label ${old.label} of ${old.type} type! Old slot: ${old.slot} -> Latest slot: ${latest.slot}`;
      this.result[contractName].push(chalk.red(msg));
    }

    if (old.offset !== latest.offset) {
      const msg = `Different offsets for label ${old.label} of ${old.type} type! Old offset: ${old.offset} -> Latest offset: ${latest.offset}`;
      this.result[contractName].push(chalk.red(msg));
    }

    if (old.label !== latest.label) {
      const msg = `Labels in slot ${old.slot} are different! Old label: ${old.label} -> Latest label: ${latest.label}`;
      this.result[contractName].push(chalk.red(msg));
    }

    return 0;
  }
}
