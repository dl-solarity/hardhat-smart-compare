import { ChangeType, CompareData, CompareInfo, ContractStorageLayout } from "../types";
import { StorageCompareTools } from "./storage-compare-tools";
import { getContractFullName, isInContracts, removeStorageEntry } from "./utils";

export class NormalizationTools {
  public inconsistencies: CompareInfo = {};
  private compareUtil_: StorageCompareTools = new StorageCompareTools();
  private oldPool_: ContractStorageLayout[] = [];
  private latestPool_: ContractStorageLayout[] = [];

  private splitContractsByDifference(
    previous: ContractStorageLayout[],
    changed: ContractStorageLayout[]
  ): {
    normalized: ContractStorageLayout[];
    pool: ContractStorageLayout[];
  } {
    return previous.reduce(
      (result, entry) => {
        return isInContracts(changed, entry)
          ? { ...result, normalized: [...result.normalized, entry] }
          : { ...result, pool: [...result.pool, entry] };
      },
      { normalized: [] as ContractStorageLayout[], pool: [] as ContractStorageLayout[] }
    );
  }

  normalizeContracts(
    old: ContractStorageLayout[],
    latest: ContractStorageLayout[]
  ): [ContractStorageLayout[], ContractStorageLayout[]] {
    let normalizedLatest: ContractStorageLayout[] = [];
    let normalizedOld: ContractStorageLayout[] = [];

    const innerJointContracts = old.filter((old) => isInContracts(latest, old));

    const changesBetweenOld = this.splitContractsByDifference(old, innerJointContracts);
    normalizedOld = changesBetweenOld.normalized;
    this.oldPool_ = changesBetweenOld.pool;

    const changesBetweenLatest = this.splitContractsByDifference(latest, innerJointContracts);
    normalizedLatest = changesBetweenLatest.normalized;
    this.latestPool_ = changesBetweenLatest.pool;

    this.solveConflicts();

    function sortContractsByFullName(contracts: ContractStorageLayout[]) {
      return contracts.sort((a, b) => getContractFullName(a).localeCompare(getContractFullName(b)));
    }

    return [sortContractsByFullName(normalizedOld), sortContractsByFullName(normalizedLatest)];
  }

  private parseInconsistenciesFromPool(pool: ContractStorageLayout[], changeType: ChangeType) {
    for (const contract of pool) {
      const contractFullName = getContractFullName(contract);
      this.inconsistencies[contractFullName] ??= new Set<CompareData>();

      this.inconsistencies[contractFullName].add({
        changeType,
        contractName: contractFullName,
      });
    }
  }

  private solveConflicts() {
    if (this.oldPool_.length === 0 && this.latestPool_.length === 0) {
      return;
    }

    const infoField = "Informational Data!";

    this.inconsistencies[infoField] ??= new Set<CompareData>();

    if (this.oldPool_.length === 0) {
      this.parseInconsistenciesFromPool(this.latestPool_, ChangeType.NewContract);

      return;
    }

    if (this.latestPool_.length === 0) {
      this.parseInconsistenciesFromPool(this.oldPool_, ChangeType.RemovedContract);

      return;
    }

    for (const oldEntry of this.oldPool_) {
      let isMatched = false;
      let nameToDelete = "";
      const oldContractName = getContractFullName(oldEntry);

      for (const latestEntry of this.latestPool_) {
        const latestContractName = getContractFullName(latestEntry);

        this.inconsistencies[oldContractName] ??= new Set<CompareData>();
        this.inconsistencies[latestContractName] ??= new Set<CompareData>();

        this.compareUtil_.compareNormContractStorage(oldEntry.entries, latestEntry.entries);

        if (this.inconsistencies[oldContractName].size || this.inconsistencies[latestContractName].size) {
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
          contractName: getContractFullName(contract),
        });
      }
    }

    for (const contract of this.latestPool_) {
      this.inconsistencies[infoField].add({
        changeType: ChangeType.NewContract,
        contractName: getContractFullName(contract),
      });
    }
  }
}
