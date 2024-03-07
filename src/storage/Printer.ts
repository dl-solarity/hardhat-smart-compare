import { infoMessage } from "./constants";
import { ChangeType, CompareData, CompareInfo } from "./types";

export class Printer {
  constructor(
    private buildInfoDiff_: CompareInfo,
    private contractsDiff_: CompareInfo,
  ) {}

  print() {
    console.info(infoMessage);

    for (const contract in this.buildInfoDiff_) {
      console.info(`\nContract: ${contract}`);
      this.printContractDiff(this.buildInfoDiff_[contract]);
    }

    for (const contract in this.contractsDiff_) {
      console.info(`\nContract: ${contract}`);
      this.printContractDiff(this.contractsDiff_[contract]);
    }

    console.info("\n");
  }

  private printContractDiff(contractDiff: Set<CompareData>) {
    for (const diff of contractDiff) {
      if (diff.message) {
        console.info(`\t${diff.message}`);
      } else {
        console.info(`\t${ChangeType[diff.changeType]}`);
      }

      if (diff.storageChangeData) {
        this.printStorageChange(diff.storageChangeData);
      }
      if (diff.typeChangeData) {
        this.printTypeChange(diff.typeChangeData);
      }
    }
  }

  private printStorageChange(storageChangeData: CompareData["storageChangeData"]) {
    if (!storageChangeData) {
      return;
    }

    if (storageChangeData.label) {
      console.info(`\t\tLabel: ${storageChangeData.label?.[0]} -> ${storageChangeData.label?.[1]}`);
    }
    if (storageChangeData.slot) {
      console.info(`\t\tSlot: ${storageChangeData.slot?.[0]} -> ${storageChangeData.slot?.[1]}`);
    }
    if (storageChangeData.type) {
      console.info(`\t\tType: ${storageChangeData.type?.[0]} -> ${storageChangeData.type?.[1]}`);
    }
    if (storageChangeData.offset) {
      console.info(`\t\tOffset: ${storageChangeData.offset?.[0]} -> ${storageChangeData.offset?.[1]}`);
    }
  }

  private printTypeChange(typeChangeData: CompareData["typeChangeData"]) {
    if (!typeChangeData) {
      return;
    }

    if (typeChangeData.encoding) {
      console.info(`\t\tEncoding: ${typeChangeData.encoding?.[0]} -> ${typeChangeData.encoding?.[1]}`);
    }
    if (typeChangeData.numberOfBytes) {
      console.info(`\t\tNumber of bytes: ${typeChangeData.numberOfBytes?.[0]} -> ${typeChangeData.numberOfBytes?.[1]}`);
    }
  }
}
