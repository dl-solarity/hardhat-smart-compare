import {
  CompareResult,
  ContractFileStorageLayout,
  ContractStorageLayout,
  StorageEntry,
  StorageLayoutEntry,
  TypeEntries,
  TypeEntry,
} from "./types";
import isEqual from "lodash.isequal";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";

export function CompareSnapshots(
  old_: ContractFileStorageLayout[][],
  new_: ContractFileStorageLayout[][]
): CompareResult {
  if (old_.length != new_.length) {
    throw new NomicLabsHardhatPluginError(
      pluginName,
      "Snapshots that you trying to compare is too different for current version!"
    );
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < old_.length; i++) {
    for (let j = 0; j < old_[i].length && j < new_[i].length; j++) {
      const compareResult = compareContractFileStorageLayout(old_[i][j], new_[i][j]);

      if (compareResult.isDiff) {
        errors.push(...compareResult.errors);
        warnings.push(...compareResult.warnings);
      }
    }

    if (old_[i].length > new_[i].length) {
      const missingEntries = old_.slice(new_[i].length);
      for (const entry of missingEntries) {
        for (const files of entry) {
          warnings.push(`Missing following files ${files.source}`);
        }
      }
    }

    if (old_[i].length < new_[i].length) {
      const missingEntries = new_.slice(old_[i].length);
      for (const entry of missingEntries) {
        for (const files of entry) {
          warnings.push(`Newly added files ${files.source}`);
        }
      }
    }
  }

  return {
    errors: errors,
    warnings: warnings,
    isDiff: errors.length > 0 || warnings.length > 0,
  };
}

function compareContractFileStorageLayout(
  old_: ContractFileStorageLayout,
  new_: ContractFileStorageLayout
): CompareResult {
  if (old_.source !== new_.source) {
    return {
      errors: [],
      warnings: [`Could not correctly match sources: ${old_.source} and ${new_.source}\nPossibly new contract file!\n`],
      isDiff: true,
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < old_.contracts.length && i < new_.contracts.length; i++) {
    const compareResult = compareContractStorageLayout(old_.source, old_.contracts[i], new_.contracts[i]);

    if (compareResult.isDiff) {
      errors.push(...compareResult.errors);
      warnings.push(...compareResult.warnings);
    }
  }

  if (old_.contracts.length > new_.contracts.length) {
    const missingEntries = old_.contracts.slice(new_.contracts.length);
    for (const entry of missingEntries) {
      warnings.push(`Missing contract ${entry.name} in ${old_.source}`);
    }
  }

  if (old_.contracts.length < new_.contracts.length) {
    const missingEntries = new_.contracts.slice(old_.contracts.length);
    for (const entry of missingEntries) {
      warnings.push(`Newly added contract ${entry.name} in ${new_.source}`);
    }
  }

  return {
    errors: errors,
    warnings: warnings,
    isDiff: errors.length > 0 || warnings.length > 0,
  };
}

function compareContractStorageLayout(
  source_: string,
  old_: ContractStorageLayout,
  new_: ContractStorageLayout
): CompareResult {
  if (old_.name === new_.name) {
    return compareStorageLayoutEntry(old_.entries, new_.entries);
  }

  return {
    errors: [],
    warnings: [`Could not correctly match contracts ${old_.name} and ${new_.name} of source ${source_}`],
    isDiff: true,
  };
}

function compareStorageLayoutEntry(old_: StorageLayoutEntry, new_: StorageLayoutEntry): CompareResult {
  if (old_ === undefined && new_ === undefined) {
    return emptyResult;
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < old_.storage.length && i < new_.storage.length; i++) {
    const compareResult = compareStorageEntry(old_.storage[i], new_.storage[i], old_.types, new_.types);

    if (compareResult.isDiff) {
      errors.push(...compareResult.errors);
      warnings.push(...compareResult.warnings);
    }
  }

  if (old_.storage.length > new_.storage.length) {
    const missingEntries = old_.storage.slice(new_.storage.length);
    for (const entry of missingEntries) {
      errors.push(`Missing var ${entry.label} in ${entry.contract} of ${entry.type} type!`);
    }
  }

  if (old_.storage.length < new_.storage.length) {
    const missingEntries = new_.storage.slice(old_.storage.length);
    for (const entry of missingEntries) {
      warnings.push(`Newly added var ${entry.label} in ${entry.contract} of ${entry.type} type!`);
    }
  }

  return {
    errors: errors,
    warnings: warnings,
    isDiff: errors.length > 0 || warnings.length > 0,
  };
}

function compareTypes(old_: TypeEntry, new_: TypeEntry, oldTypes_: TypeEntries, newTypes_: TypeEntries): CompareResult {
  const res = isEqual(old_, new_);

  return {
    errors: res ? findDiff(old_, new_, oldTypes_, newTypes_).errors : [],
    warnings: [],
    isDiff: res,
  };
}

function findDiff(old_: TypeEntry, new_: TypeEntry, oldTypes_: TypeEntries, newTypes_: TypeEntries): CompareResult {
  let compareResult = checkUndefinedValues(old_, new_);
  if (compareResult.isDiff) {
    return compareResult;
  }

  if (old_ === undefined && new_ === undefined) {
    return emptyResult;
  }

  const errors: string[] = [];
  const firstObjectEntries = Object.entries(old_);
  const secondObjectEntries = Object.entries(new_);

  for (let i = 0; i < firstObjectEntries.length; i++) {
    compareResult = checkUndefinedValues(firstObjectEntries[i][1], secondObjectEntries[i][1]);

    if (compareResult.isDiff) {
      errors.push(...compareResult.errors);
      continue;
    }

    const isString = typeof firstObjectEntries[i][1] === "string" && typeof secondObjectEntries[i][1] === "string";

    if (isString) {
      compareResult = compareNotObjectValue(
        firstObjectEntries[i][0],
        firstObjectEntries[i][1],
        secondObjectEntries[i][1]
      );
      if (compareResult.isDiff) {
        errors.push(...compareResult.errors);
      }
      continue;
    }

    const isMembersField = firstObjectEntries[i][0] === "members" && secondObjectEntries[i][0] === "members";

    if (isMembersField) {
      const compareResult = compareStorageEntry(
        firstObjectEntries[i][1],
        secondObjectEntries[i][1],
        oldTypes_,
        newTypes_
      );

      if (compareResult.isDiff) {
        errors.push(...compareResult.errors);
      }
    }
  }

  return {
    errors: errors,
    warnings: [],
    isDiff: true,
  };
}

const emptyResult = {
  errors: [],
  warnings: [],
  isDiff: false,
};

function compareStorageEntry(
  old_: StorageEntry,
  new_: StorageEntry,
  oldTypes_: TypeEntries,
  newTypes_: TypeEntries
): CompareResult {
  let compareResult = checkUndefinedValues(old_, new_);
  if (compareResult.isDiff) {
    return compareResult;
  }

  if (old_ === undefined && new_ === undefined) {
    return emptyResult;
  }

  const errors: string[] = [];
  const firstObjectEntries = Object.entries(old_);
  const secondObjectEntries = Object.entries(new_);

  for (let i = 0; i < firstObjectEntries.length; i++) {
    if (firstObjectEntries[i][0] === "type") {
      break;
    }

    const compareResult = compareNotObjectValue(
      firstObjectEntries[i][0],
      firstObjectEntries[i][1],
      secondObjectEntries[i][1]
    );

    if (compareResult.isDiff) {
      errors.push(...compareResult.errors);
    }
  }

  compareResult = compareTypes(oldTypes_[old_.type], newTypes_[new_.type], oldTypes_, newTypes_);
  if (compareResult.isDiff) {
    errors.push(...compareResult.errors);
  }

  return {
    errors: errors,
    warnings: [],
    isDiff: true,
  };
}

function checkUndefinedValues(old_: any | undefined, new_: any | undefined): CompareResult {
  if (old_ === undefined && new_ === undefined) {
    return emptyResult;
  }

  if ((old_ === undefined && new_ !== undefined) || (old_ !== undefined && new_ === undefined)) {
    return {
      errors: [`Different entries:\nOld:${old_}\nNew:${new_}\n`],
      warnings: [],
      isDiff: true,
    };
  }

  return emptyResult;
}

function compareNotObjectValue(key_: string, old_: any, new_: any): CompareResult {
  if (old_ === new_) {
    return emptyResult;
  }

  return {
    errors: [`Type entry ${key_} is diff!\nExpected: ${old_}\nActual: ${new_}`],
    warnings: [],
    isDiff: true,
  };
}
