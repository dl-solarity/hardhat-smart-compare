import { BuildInfo } from "hardhat/types";

import { ImpactMapping, InheritanceMapping } from "../types";

export class InheritanceParser {
  public result: ImpactMapping = {};

  analyzeInheritanceImpact(buildInfo: BuildInfo) {
    const inheritanceTree = this.extractInheritanceTree(buildInfo);

    for (const contractName in inheritanceTree) {
      for (const bases of inheritanceTree[contractName].linearizedBaseContracts) {
        if (this.result[bases] === undefined) {
          this.result[bases] = [];
        }

        this.result[bases].push(contractName);
      }
    }
  }

  extractInheritanceTree(buildInfo: BuildInfo): InheritanceMapping {
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

      // This refers to a *.sol file in which the contract is not defined,
      // for example, as is usually the case with Globals.sol
      if (contractMapById[id_].linearizedBaseContracts === undefined) {
        continue;
      }

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
}
