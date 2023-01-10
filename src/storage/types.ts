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

export interface StorageLayoutEntry {
  storage: StorageEntry[];
  types: {
    [type_name: string]: TypeEntry;
  };
}

export interface ContractStorageLayout {
  name: string;
  entries: StorageLayoutEntry;
}

export interface ContractFileStorageLayout {
  source: string;
  contracts: ContractStorageLayout[];
}
