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

export function parseContractStorageLayout(buildInfoDataArray: BuildInfoData[]): ContractStorageLayout[] {
  return buildInfoDataArray.map((buildInfoData) => buildInfoData.contracts).flat();
}
