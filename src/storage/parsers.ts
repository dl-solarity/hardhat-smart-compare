import { BuildInfo, CompilerOutputContract } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";
import { BuildInfoData, ContractStorageLayout, StorageLayoutEntry } from "./types";
import { getInheritanceImpact } from "./get-inheritance-data";

export function ParseBuildInfo(contract: BuildInfo): BuildInfoData {
  return {
    contracts: parseContracts(contract.output.contracts),
    format: contract._format,
    solcLongVersion: contract.solcLongVersion,
    solcVersion: contract.solcVersion,
    impactMapping: getInheritanceImpact(contract),
  };
}

function parseContracts(contracts: { [p: string]: { [p: string]: CompilerOutputContract } }): ContractStorageLayout[] {
  const resultArr = [];

  for (const [sourceName, contractData] of Object.entries(contracts)) {
    resultArr.push(...parseContractFile(sourceName, contractData));
  }

  return resultArr;
}

function parseContractFile(source: string, contract: { [p: string]: CompilerOutputContract }): ContractStorageLayout[] {
  const resultArr = [];

  for (const [contractName, contractStorage] of Object.entries(contract)) {
    let contractStorageLayout: ContractStorageLayout = {
      name: contractName,
      source: source,
      entries: extractStorageLayout(contractStorage),
    };

    resultArr.push(contractStorageLayout);
  }

  return resultArr;
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
