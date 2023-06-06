import { TASK_STORAGE_COMPARE, TASK_STORAGE_SAVE } from "./constants";

import { extendConfig, task, types } from "hardhat/config";
import { ActionType, HardhatRuntimeEnvironment } from "hardhat/types";

import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { compareConfigExtender, mergeCompareArgs } from "./config";
import { StorageLayout } from "./storage/StorageLayout";
import { CompareArgs } from "./types";

import fsExtra from "fs-extra";

extendConfig(compareConfigExtender);

const reCompileArtifacts = async (env: HardhatRuntimeEnvironment) => {
  // TODO: Do we need to remove artifacts, if we are going to compile force???
  // Make sure that contract artifacts are up-to-date.
  await fsExtra.remove(env.config.paths.artifacts);

  await env.run(TASK_COMPILE, {
    quiet: true,
    force: true,
  });
};

const storageSave: ActionType<CompareArgs> = async (taskArgs, env) => {
  mergeCompareArgs(env, taskArgs);

  await reCompileArtifacts(env);

  const storageLayout = new StorageLayout(env);
  await storageLayout.saveSnapshot(env.config.compare.snapshotFileName);
};

const storageCompare: ActionType<CompareArgs> = async (taskArgs, env) => {
  mergeCompareArgs(env, taskArgs);

  await reCompileArtifacts(env);

  const storageLayout = new StorageLayout(env);
  await storageLayout.compareSnapshots(env.config.compare.snapshotFileName);
};

task(TASK_STORAGE_SAVE, "Saves the contract storage layout")
  .addOptionalParam(
    "snapshotPath",
    "Path to the directory where you want to save the storage layout snapshot.",
    undefined,
    types.string
  )
  .addOptionalParam("snapshotFileName", "Future file name of the snapshot.", undefined, types.string)
  .setAction(storageSave);

task(TASK_STORAGE_COMPARE, "Compare current storage layout with given.")
  .addOptionalParam(
    "savedSpPath",
    "Path to the directory where the saved storage layout snapshot was saved.",
    undefined,
    types.string
  )
  .addOptionalParam("savedSpName", "File name of the saved snapshot.", undefined, types.string)
  .setAction(storageCompare);
