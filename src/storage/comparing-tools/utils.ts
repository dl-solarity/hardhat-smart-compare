import { BuildInfoData, ContractStorageLayout } from "../types";

export const getContractFullName = (contract: ContractStorageLayout) => {
  return `${contract.source}:${contract.name}`;
};

export function removeStorageEntry(arr: ContractStorageLayout[], value: string) {
  return arr.filter(function (element: ContractStorageLayout) {
    return getContractFullName(element) != value;
  });
}

export function findContract(contracts: ContractStorageLayout[], name: string, source: string): number {
  return contracts.findIndex((element) => {
    return getContractFullName(element) === `${source}:${name}`;
  });
}

export const isInContracts = (latest: ContractStorageLayout[], old: ContractStorageLayout) =>
  findContract(latest, old.name, old.source) !== -1;

export function mergeBuildInfos(
  old: BuildInfoData[],
  latest: BuildInfoData[]
): [ContractStorageLayout[], ContractStorageLayout[]] {
  const mergedOld: ContractStorageLayout[] = [];
  const mergedLatest: ContractStorageLayout[] = [];

  for (const entry of old) {
    mergedOld.push(...entry.contracts);
  }

  for (const entry of latest) {
    mergedLatest.push(...entry.contracts);
  }

  return [mergedOld, mergedLatest];
}
