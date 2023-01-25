import { BuildInfo } from "hardhat/types";
import { ImpactMapping, InheritanceMapping } from "./types";

export function getInheritanceImpact(buildInfo: BuildInfo): ImpactMapping {
  const inheritanceTree = extractInheritanceTree(buildInfo);

  const result: ImpactMapping = {};

  for (const contractName in inheritanceTree) {
    for (const bases of inheritanceTree[contractName].linearizedBaseContracts) {
      if (result[bases] === undefined) {
        result[bases] = [];
      }

      result[bases].push(contractName);
    }
  }

  return result;
}

export function extractInheritanceTree(buildInfo: BuildInfo): InheritanceMapping {
  const contractMapById: {
    [id: number]: {
      fullContractName: string;
      linearizedBaseContracts: number[];
    };
  } = {};

  for (const [pathName, sources] of Object.entries(buildInfo.output.sources)) {
    for (const entries of sources.ast["nodes"]) {
      if (entries.name !== undefined) {
        const fullContractName = `${pathName}:${entries.name}`;
        contractMapById[entries.id] = {
          fullContractName: fullContractName,
          linearizedBaseContracts: entries.linearizedBaseContracts,
        };
      }
    }
  }

  const result: InheritanceMapping = {};

  for (const id_ in contractMapById) {
    result[contractMapById[id_].fullContractName] = {
      id: Number(id_),
      linearizedBaseContracts: [],
    };

    for (const bases of contractMapById[id_].linearizedBaseContracts) {
      if (contractMapById[id_].linearizedBaseContracts.length > 1) {
        result[contractMapById[id_].fullContractName].linearizedBaseContracts.push(
          contractMapById[bases].fullContractName
        );
      }
    }
  }

  return result;
}
