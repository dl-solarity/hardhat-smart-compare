import { ChangeType, CompareData, CompareInfo, ContractStorageLayout } from "../types";
import { isInContracts, removeStorageEntry } from "./utils";
import { StorageCompareTools } from "./storage-compare-tools";

export class NormalizationTools {
  public inconsistencies: CompareInfo = {};
  private compareUtil_: StorageCompareTools;
  private oldPool_: ContractStorageLayout[] = [];
  private latestPool_: ContractStorageLayout[] = [];

  constructor() {
    this.compareUtil_ = new StorageCompareTools();
  }

  normalizeContracts(
    old: ContractStorageLayout[],
    latest: ContractStorageLayout[]
  ): [ContractStorageLayout[], ContractStorageLayout[]] {
    const filteredArray = old.filter((old) => isInContracts(latest, old));

    let normalizedLatest: ContractStorageLayout[] = [];
    let normalizedOld: ContractStorageLayout[] = [];

    if (filteredArray.length != old.length) {
      for (const entry of old) {
        if (!isInContracts(filteredArray, entry)) {
          this.oldPool_.push(entry);
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
          this.latestPool_.push(entry);
          continue;
        }

        normalizedLatest.push(entry);
      }
    } else {
      normalizedLatest = latest;
    }

    this.solveConflicts();

    return [
      normalizedOld.sort((a, b) => (a.source + ":" + a.name).localeCompare(b.source + ":" + b.name)),
      normalizedLatest.sort((a, b) => (a.source + ":" + a.name).localeCompare(b.source + ":" + b.name)),
    ];
  }

  private solveConflicts() {
    if (this.oldPool_.length === 0 && this.latestPool_.length === 0) {
      return;
    }

    const infoField = "Informational Data!";
    if (this.inconsistencies[infoField] === undefined) {
      this.inconsistencies[infoField] = new Set<CompareData>();
    }

    if (this.oldPool_.length === 0) {
      for (const contract of this.latestPool_) {
        this.inconsistencies[infoField].add({
          changeType: ChangeType.NewContract,
          contractName: `${contract.source}:${contract.name}`,
        });
      }

      return;
    }

    if (this.latestPool_.length === 0) {
      for (const contract of this.oldPool_) {
        this.inconsistencies[infoField].add({
          changeType: ChangeType.RemovedContract,
          contractName: `${contract.source}:${contract.name}`,
        });
      }

      return;
    }

    for (const oldEntry of this.oldPool_) {
      let isMatched = false;
      let nameToDelete = "";

      for (const latestEntry of this.latestPool_) {
        const oldContractName = `${oldEntry.source}:${oldEntry.name}`;
        const latestContractName = `${latestEntry.source}:${latestEntry.name}`;

        if (this.inconsistencies[oldContractName] === undefined) {
          this.inconsistencies[oldContractName] = new Set<CompareData>();
        }

        if (this.inconsistencies[latestContractName] === undefined) {
          this.inconsistencies[latestContractName] = new Set<CompareData>();
        }

        this.compareUtil_.compareNormContractStorage(oldEntry.entries, latestEntry.entries);

        if (this.inconsistencies[oldContractName].size > 0 || this.inconsistencies[latestContractName].size > 0) {
          this.inconsistencies[oldContractName].clear();
          this.inconsistencies[latestContractName].clear();
          continue;
        }

        this.inconsistencies[infoField].add({
          changeType: ChangeType.RenamedContract,
          message: `Renamed contract from ${oldContractName} to ${latestContractName}`,
        });

        isMatched = true;
        oldEntry.name = "1_Matched!";
        nameToDelete = latestContractName;

        break;
      }

      if (isMatched) {
        this.latestPool_ = removeStorageEntry(this.latestPool_, nameToDelete);
      }
    }

    for (const contract of this.oldPool_) {
      if (contract.name !== "1_Matched!") {
        this.inconsistencies[infoField].add({
          changeType: ChangeType.RemovedContract,
          contractName: `${contract.source}:${contract.name}`,
        });
      }
    }

    for (const contract of this.latestPool_) {
      this.inconsistencies[infoField].add({
        changeType: ChangeType.NewContract,
        contractName: `${contract.source}:${contract.name}`,
      });
    }
  }
}
