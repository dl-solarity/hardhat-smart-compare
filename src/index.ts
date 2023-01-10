import { TASK_STORAGE_SAVE } from "./constants";

import { extendConfig, task, types } from "hardhat/config";
import { ActionType } from "hardhat/types";

import { compareConfigExtender, mergeCompareArgs } from "./config";
import { StorageLayout } from "./storage/storage-layout";
import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { CompareArgs } from "./types";

extendConfig(compareConfigExtender);

const storage_save: ActionType<CompareArgs> = async (taskArgs, env) => {
  mergeCompareArgs(env, taskArgs);

  // Make sure that contract artifacts are up-to-date.
  await env.run(TASK_COMPILE, {
    quiet: true,
    force: true,
  });

  const storageLayout = new StorageLayout(env);
  await storageLayout.saveSnapshot();
};

task(TASK_STORAGE_SAVE, "Saves the contract storage layout")
  .addOptionalParam(
    "snapshotPath",
    "Path to the directory where you want to save the storage layout snapshot.",
    undefined,
    types.string
  )
  .setAction(storage_save);
