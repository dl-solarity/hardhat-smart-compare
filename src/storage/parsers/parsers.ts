import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { BuildInfo } from "hardhat/types";

import { pluginName } from "../../constants";
import { BuildInfoData, ContractBuilds, ContractsData, ContractStorageLayout, StorageLayoutEntry } from "../types";

export function ParseBuildInfo(contract: BuildInfo): BuildInfoData {
  const contractStorageLayout: ContractStorageLayout[] = parseContracts(contract.output.contracts);

  return {
    contracts: contractStorageLayout,
    format: contract._format,
    solcLongVersion: contract.solcLongVersion,
    solcVersion: contract.solcVersion,
  };
}

function parseContracts(contracts: ContractBuilds): ContractStorageLayout[] {
  return Object.entries(contracts).flatMap(([sourceName, contractData]) => parseContractFile(sourceName, contractData));
}

function parseContractFile(source: string, contract: ContractsData): ContractStorageLayout[] {
  return Object.entries(contract).map(([contractName, contractStorage]) => ({
    name: contractName,
    source: source,
    entries: extractStorageLayout(contractStorage),
  }));
}

// We need to use `any` type because, `storageLayout` field in evm Object is optional and
// only included into `CompilerOutputContract.evm` if `storageLayout` option specified for compiler
// For more information see here: https://docs.soliditylang.org/en/v0.8.17/using-the-compiler.html#input-description
function extractStorageLayout(output: any): StorageLayoutEntry {
  if (output.storageLayout === undefined) {
    throw new NomicLabsHardhatPluginError(
      pluginName,
      "Could not extract the storage layout!. Remove the artifacts and compile again, please!"
    );
  }

  return output.storageLayout;
}
