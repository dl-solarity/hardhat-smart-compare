import { BuildInfoData, CompareInfo, ContractStorageLayout } from "../types";
import { NormalizationTools } from "./NormalizationTools";
import { StorageCompareTools } from "./StorageCompareTools";
import { parseContractStorageLayout } from "./utils";

export class StorageCompare {
  public compareTool: StorageCompareTools;
  public normalizationTool: NormalizationTools;

  constructor() {
    this.compareTool = new StorageCompareTools();
    this.normalizationTool = new NormalizationTools();
  }

  compareBuildInfos(oldSnapshot: BuildInfoData[], newSnapshot: BuildInfoData[]): [CompareInfo, CompareInfo] {
    const oldContracts = parseContractStorageLayout(oldSnapshot);
    const latestContracts = parseContractStorageLayout(newSnapshot);

    return this.compareContractStorageLayouts(oldContracts, latestContracts);
  }

  compareContractStorageLayouts(
    old: ContractStorageLayout[],
    latest: ContractStorageLayout[],
  ): [CompareInfo, CompareInfo] {
    const [normalizedOld, normalizedLatest] = this.normalizationTool.normalizeContracts(old, latest);

    for (let i = 0; i < normalizedOld.length; i++) {
      this.compareTool.compareNormContractStorage(normalizedOld[i].entries, normalizedLatest[i].entries);
    }

    return [this.normalizationTool.inconsistencies, this.compareTool.result];
  }
}
