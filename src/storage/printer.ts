import { CompareInfo, ImpactMapping } from "./types";
import { infoMessage } from "./constants";

export class Printer {
  constructor(
    private buildInfoDiff_: CompareInfo,
    private contractsDiff_: CompareInfo,
    private impactMappingOld_: ImpactMapping,
    private impactMappingLatest_: ImpactMapping
  ) {}

  print() {
    console.log(infoMessage);

    console.log("Build Info Difference");
    console.log(this.buildInfoDiff_);
    console.log("Contracts Difference");
    console.log(this.contractsDiff_);
  }
}
