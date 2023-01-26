import { BuildInfoData, CompareInfo, ContractStorageLayout } from "../types";
import { mergeBuildInfos } from "./utils";
import { StorageCompareTools } from "./storage-compare-tools";
import { NormalizationTools } from "./normalization-tools";

export class StorageCompare {
  public compareTool: StorageCompareTools;
  public normalizationTool: NormalizationTools;

  constructor() {
    this.compareTool = new StorageCompareTools();
    this.normalizationTool = new NormalizationTools();
  }

  compareBuildInfos(oldSnapshot: BuildInfoData[], newSnapshot: BuildInfoData[]): [CompareInfo, CompareInfo] {
    const [oldContracts, latestContracts] = mergeBuildInfos(oldSnapshot, newSnapshot);

    return this.compareContractStorageLayouts(oldContracts, latestContracts);
  }

  compareContractStorageLayouts(
    old: ContractStorageLayout[],
    latest: ContractStorageLayout[]
  ): [CompareInfo, CompareInfo] {
    const [normalizedOld, normalizedLatest] = this.normalizationTool.normalizeContracts(old, latest);

    for (let i = 0; i < normalizedOld.length; i++) {
      this.compareTool.compareNormContractStorage(normalizedOld[i].entries, normalizedLatest[i].entries);
    }

    return [this.normalizationTool.inconsistencies, this.compareTool.result];
  }
}
