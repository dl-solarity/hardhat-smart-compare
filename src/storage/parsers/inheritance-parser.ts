import { BuildInfo } from "hardhat/types";
import { ContractDefinition, SourceUnit } from "solidity-ast";
import { astDereferencer, findAll } from "solidity-ast/utils";

import { ImpactMapping, InheritanceMapping } from "../types";

export class InheritanceParser {
  public result: ImpactMapping = {};

  analyzeInheritanceImpact(buildInfo: BuildInfo) {
    const inheritanceTree = this.extractInheritanceTree(buildInfo);

    for (const contractName in inheritanceTree) {
      for (const bases of inheritanceTree[contractName].linearizedBaseContracts) {
        this.result[bases] ??= [];

        this.result[bases].push(contractName);
      }
    }
  }

  extractInheritanceTree(buildInfo: BuildInfo): InheritanceMapping {
    function parseFullContractNameFromAstNode(sourceUnit: SourceUnit, node: ContractDefinition): string {
      return `${sourceUnit.absolutePath}:${node.name}`;
    }

    const deref = astDereferencer(buildInfo.output);

    const result: InheritanceMapping = {};

    for (const sources of Object.values(buildInfo.output.sources)) {
      const sourceUnit: SourceUnit = sources.ast;

      for (const contract of findAll("ContractDefinition", sourceUnit)) {
        const fullContractName = parseFullContractNameFromAstNode(sourceUnit, contract);

        result[fullContractName] = {
          id: contract.id,
          linearizedBaseContracts: contract.linearizedBaseContracts.map((id) => {
            const { node, sourceUnit } = deref.withSourceUnit("ContractDefinition", id);
            return parseFullContractNameFromAstNode(sourceUnit, node);
          }),
        };
      }
    }

    return result;
  }
}
