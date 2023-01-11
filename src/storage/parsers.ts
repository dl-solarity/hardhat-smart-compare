import { BuildInfo, CompilerOutputContract } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";
import { ContractFileStorageLayout, StorageLayoutEntry } from "./types";

export function ParseBuildInfo(contract: BuildInfo | undefined): ContractFileStorageLayout[] {
  if (contract === undefined) {
    throw new NomicLabsHardhatPluginError(pluginName, "Could not match the contract with the related build info file!");
  }
  return ParseContracts(contract.output.contracts);
}

function ParseContracts(contracts: {
  [p: string]: { [p: string]: CompilerOutputContract };
}): ContractFileStorageLayout[] {
  const resultArr = [];
  for (const [sourceName, contractData] of Object.entries(contracts)) {
    resultArr.push(ParseContractFile(sourceName, contractData));
  }
  return resultArr;
}

function ParseContractFile(
  source: string,
  contract: { [p: string]: CompilerOutputContract }
): ContractFileStorageLayout {
  const resultArr = [];
  for (const [contractName, contractStorage] of Object.entries(contract)) {
    let contractStorageLayout = {
      name: contractName,
      entries: extractStorageLayout(contractStorage),
    };

    resultArr.push(contractStorageLayout);
  }

  return {
    source: source,
    contracts: resultArr,
  };
}

// We need to use `any` type because, `storageLayout` field in evm Object is optional and
// only included into `CompilerOutputContract.evm` if `storageLayout` option specified for compiler
// For more information see here: https://docs.soliditylang.org/en/v0.8.17/using-the-compiler.html#input-description
function extractStorageLayout(output: any): StorageLayoutEntry {
  if (output.storageLayout === undefined) {
    throw new NomicLabsHardhatPluginError(
      pluginName,
      "Could not extract the storage layout!\n" + "Report a bug, please!"
    );
  }

  return output.storageLayout;
}
