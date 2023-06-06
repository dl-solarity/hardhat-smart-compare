import { assert, expect } from "chai";
import sinon from "sinon";
import { TASK_STORAGE_COMPARE, TASK_STORAGE_SAVE } from "../../src/constants";
import { infoMessage } from "../../src/storage/constants";
import { Printer } from "../../src/storage/Printer";
import { useEnvironment } from "../helpers";

describe("Printer", () => {
  describe("print", () => {
    it("should print the build info difference", async function () {
      const printer = new Printer(undefined as any, {} as any, {} as any, {} as any);

      let spy = sinon.spy(console, "log");
      printer.print();

      assert.isTrue(spy.calledWith(infoMessage));
      assert.isTrue(spy.calledWith("Build Info Difference"));
      assert.isTrue(spy.calledWith("Contracts Difference"));

      spy.restore();
    });
  });
});
