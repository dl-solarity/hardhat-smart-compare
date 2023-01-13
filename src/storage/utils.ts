import { ContractStorageLayout } from "./types";
export const GetContractFullName = (contract: ContractStorageLayout) => {
  return `${contract.source}:${contract.name}`;
};

export function RemoveStorageEntry(arr: ContractStorageLayout[], value: string) {
  return arr.filter(function (elem: ContractStorageLayout) {
    return `${elem.source}:${elem.name}` != value;
  });
}
