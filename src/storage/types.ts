// Here you can find an explanation of each field in the following interface:
// https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html#json-output
export interface StorageEntry {
  astId: number;
  contract: string;
  label: string;
  offset: number;
  slot: string;
  type: string;
}

export interface TypeEntry {
  base?: string;
  encoding: string;
  key?: string;
  label: string;
  members?: StorageEntry[];
  numberOfBytes: string;
  value?: string;
}

export interface TypeEntries {
  [type_name: string]: TypeEntry;
}

export interface StorageLayoutEntry {
  storage: StorageEntry[];
  types: TypeEntries;
}

export interface ContractStorageLayout {
  name: string;
  source: string;
  entries: StorageLayoutEntry;
}

export interface BuildInfoData {
  solcVersion: string;
  solcLongVersion: string;
  format: string;
  contracts: ContractStorageLayout[];
}

export enum ChangeType {
  RemovedContract,
  NewContract,
  RenamedContract,
  NewStorageEntry,
  MissedStorageEntry,
  StorageChange,
  TypeChange,
}

export interface StorageChangeData {
  label: [string, string];
  slot: [string, string];
  type: [string, string];
  offset: [number, number];
}

export const EmptyStorageChangeData: StorageChangeData = {
  label: ["", ""],
  slot: ["", ""],
  type: ["", ""],
  offset: [-1, -1],
};

export interface TypeChangeData {
  label: [string, string];
  encoding: [string, string];
  numberOfBytes: [string, string];
}

export const EmptyTypeChangeData: TypeChangeData = {
  label: ["", ""],
  encoding: ["", ""],
  numberOfBytes: ["", ""],
};

export interface CompareData {
  changeType: ChangeType;
  contractName?: string;
  message?: string;
  storageChangeData?: StorageChangeData;
  typeChangeData?: TypeChangeData;
}

export interface CompareInfo {
  [contract: string]: Set<CompareData>;
}

export interface ImpactMapping {
  [contract: string]: string[];
}

export interface InheritanceMapping {
  [fullContractName: string]: {
    id: number;
    linearizedBaseContracts: string[];
  };
}
