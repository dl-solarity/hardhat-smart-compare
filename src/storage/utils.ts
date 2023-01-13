import { BuildInfoData, ContractStorageLayout } from "./types";
export const GetContractFullName = (contract: ContractStorageLayout) => {
  return `${contract.source}:${contract.name}`;
};

export function RemoveStorageEntry(arr: ContractStorageLayout[], value: string) {
  return arr.filter(function (elem: ContractStorageLayout) {
    return `${elem.source}:${elem.name}` != value;
  });
}

export function FindContract(contracts: ContractStorageLayout[], name: string = "", source: string = ""): number {
  if (source === "") {
    return contracts.findIndex((element) => {
      return element.name === name;
    });
  }

  return contracts.findIndex((element) => {
    return GetContractFullName(element) === `${source}:${name}`;
  });
}

export const IsInContracts = (latest: ContractStorageLayout[], old: ContractStorageLayout) =>
  FindContract(latest, old.name, old.source) !== -1;

export function MergeBuildInfos(
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
