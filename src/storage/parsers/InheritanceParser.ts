import { BuildInfo } from "hardhat/types";
import { ContractDefinition, SourceUnit } from "solidity-ast";
import { astDereferencer, findAll } from "solidity-ast/utils";

import { ImpactMapping, InheritanceMapping } from "../types";

export class InheritanceParser {
  public result: ImpactMapping = {};

  analyzeInheritanceImpact(buildInfo: BuildInfo) {
    const inheritanceTree = this.extractInheritanceTree(buildInfo);

    for (const [contractName, { linearizedBaseContracts }] of Object.entries(inheritanceTree)) {
      linearizedBaseContracts.forEach((base) => {
        this.result[base] ??= [];
        this.result[base].push(contractName);
      });
    }
  }

  extractInheritanceTree(buildInfo: BuildInfo): InheritanceMapping {
    function parseFullContractNameFromAstNode(sourceUnit: SourceUnit, node: ContractDefinition): string {
      return `${sourceUnit.absolutePath}:${node.name}`;
    }

    const deref = astDereferencer(buildInfo.output);

    const result: InheritanceMapping = {};

    Object.values(buildInfo.output.sources).forEach((sources) => {
      const sourceUnit: SourceUnit = sources.ast;

      for (const contract of findAll("ContractDefinition", sourceUnit)) {
        const fullContractName = parseFullContractNameFromAstNode(sourceUnit, contract);

        const linearizedBaseContracts = contract.linearizedBaseContracts.slice(1).map((id) => {
          const { node, sourceUnit } = deref.withSourceUnit("ContractDefinition", id);
          return parseFullContractNameFromAstNode(sourceUnit, node);
        });

        result[fullContractName] = {
          id: contract.id,
          linearizedBaseContracts,
        };
      }
    });

    return result;
  }
}
