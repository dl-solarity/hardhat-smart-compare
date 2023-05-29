import { assert, expect } from "chai";
import { TASK_STORAGE_COMPARE, TASK_STORAGE_SAVE } from "../../src/constants";
import { useEnvironment } from "../helpers";

describe("storage task", () => {
  useEnvironment("hardhat-project");

  describe("storage:save", () => {
    it("should throw if snapshotPath is invalid", async function () {
      await expect(
        this.hre.run(TASK_STORAGE_SAVE, {
          snapshotPath: "",
        })
      ).to.be.rejectedWith(
        `Could not create directory for storage layout snapshots: '${this.hre.config.compare.snapshotPath}'`
      );
    });

    // it("should return the proccesed arguments", async function () {
    //   const address = getRandomAddress(this.hre);
    //   const expectedArgs = {
    //     address,
    //     constructorArgs: [
    //       50,
    //       "a string argument",
    //       {
    //         x: 10,
    //         y: 5,
    //       },
    //       "0xabcdef",
    //     ],
    //     libraries: {
    //       NormalLib: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    //       ConstructorLib: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    //     },
    //     contractFQN: "contracts/TestContract.sol:TestContract",
    //     listNetworks: true,
    //     noCompile: true,
    //   };
    //   const proccesedArgs = await this.hre.run(TASK_VERIFY_RESOLVE_ARGUMENTS, {
    //     address,
    //     constructorArgsParams: [],
    //     constructorArgs: "constructor-args.js",
    //     libraries: "libraries.js",
    //     contract: "contracts/TestContract.sol:TestContract",
    //     listNetworks: true,
    //     noCompile: true,
    //   });

    //   assert.deepEqual(proccesedArgs, expectedArgs);
    // });
  });

  // describe("storage:compare ", () => {
  //   it("should throw if address is invalid", async function () {
  //     await expect(this.hre.run(TASK_STORAGE_COMPARE, {})).to.be.rejectedWith(/invalidAddress is an invalid address./);
  //   });
  // });
});
