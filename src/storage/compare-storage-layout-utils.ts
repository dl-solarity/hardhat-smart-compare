import {
  BuildInfoData,
  CompareInfo,
  ContractStorageLayout,
  StorageEntry,
  StorageLayoutEntry,
  TypeEntries,
} from "./types";
import { GetContractFullName } from "./constants";
import chalk from "chalk";
import isEqual from "lodash.isequal";

export class StorageCompare {
  private result: CompareInfo = {};

  CompareStorage(old: BuildInfoData[], latest: BuildInfoData[]): CompareInfo {
    for (let i = 0; i < old[0].contracts.length; i++) {
      this.compareStorageLayoutEntries(old[0].contracts[i].entries, latest[0].contracts[i].entries);
    }

    console.log(JSON.stringify(this.result, null, 2));
    return this.result;
  }

  private compareStorageLayoutEntries(old: StorageLayoutEntry, latest: StorageLayoutEntry) {
    for (const index in old.storage) {
      if (this.compareStorageEntries(old.storage[index].contract, old.storage[index], latest.storage[index]) === -1) {
        continue;
      }

      this.compareTypes(old, latest, Number(index));
    }

    if (old.storage.length < latest.storage.length) {
      for (const index in latest.storage.slice(old.storage.length)) {
        const contractName = latest.storage[index].contract;
        if (this.result[contractName] === undefined) {
          this.result[contractName] = [];
        }

        const msg = `Warning! New storage layout entry: label ${old.storage[index].label} of ${old.storage[index].type} type in the latest snapshot!`;
        this.result.messages.push(chalk.yellow(msg));
      }
    }
  }

  private compareStorageEntries(contractName: string, old: StorageEntry, latest: StorageEntry) {
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

  private compareTypes(old: StorageLayoutEntry, latest: StorageLayoutEntry, index: number) {
    const oldType = old.storage[index].type;
    const latestType = latest.storage[index].type;

    if (oldType === latestType) {
      return;
    }

    this.compareTypeEntries(
      oldType,
      latestType,
      old.types,
      latest.types,
      latest.storage[index].contract,
      old.storage[index].slot
    );
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
  }

  private findContract(contracts: ContractStorageLayout[], name: string = "", source: string = ""): number {
    if (source != "") {
      return contracts.findIndex((element) => {
        return this.isNameOnly(element, name);
      });
    }

    return contracts.findIndex((element) => {
      return this.isFullName(element, source + ":" + name);
    });
  }

  private isNameOnly = (element: ContractStorageLayout, name: string) => element.name === name;
  private isFullName = (element: ContractStorageLayout, fullName: string) => GetContractFullName(element) === fullName;
}
