import { TASK_COMPARE } from "./constants";

require("@nomiclabs/hardhat-etherscan");

import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";

import { extendConfig, task } from "hardhat/config";
import { ActionType } from "hardhat/types";

import { deployConfigExtender } from "./config";

interface DeploymentArgs {}

extendConfig(deployConfigExtender);

const compare: ActionType<DeploymentArgs> = async ({}, env) => {
  // Make sure that contract artifacts are up-to-date.
  await env.run(TASK_COMPILE, {
    quiet: true,
    force: true,
  });
};

task(TASK_COMPARE, "Deploy contracts").setAction(compare);
