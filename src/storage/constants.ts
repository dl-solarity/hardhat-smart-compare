import { ContractStorageLayout } from "./types";
export const GetContractFullName = (contract: ContractStorageLayout) => {
  return `${contract.source}:${contract.name}`;
};
