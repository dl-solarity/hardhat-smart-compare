import sinon from "sinon";
import { assert } from "chai";

import { infoMessage } from "../../src/storage/constants";
import { Printer } from "../../src/storage/Printer";

describe("Printer", () => {
  describe("print", () => {
    it("should print the build info difference", async function () {
      const printer = new Printer(undefined as any, {} as any);

      let spy = sinon.spy(console, "info");
      printer.print();

      assert.isTrue(spy.calledWith(infoMessage));

      spy.restore();
    });
  });
});
