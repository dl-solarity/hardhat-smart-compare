import { CompareInfo } from "./types";

export class Printer {
  constructor(private info: CompareInfo) {}
  print() {
    console.log(`\n
                            Attention! 
    There have been changes in project variables! 
    If you do not see errors below, it means that there have been changes in structures that are not related 
    to the storage itself, for example, they are only used in a functions as a memory type, etc!
    Pay extra attention to this, maybe the business logic has been changed!\n`);

    for (let [key, value] of Object.entries(this.info)) {
      if (value.size > 0) {
        console.log(`Contract: ${key}`);
        for (const entry of value) {
          console.log(entry);
        }
      }
    }
  }
}
