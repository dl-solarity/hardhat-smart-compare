[//]: # ([![npm]&#40;https://img.shields.io/npm/v/@dlsl/hardhat-smart-compare.svg&#41;]&#40;https://www.npmjs.com/package/@dlsl/hardhat-smart-compare&#41; [![hardhat]&#40;https://hardhat.org/buidler-plugin-badge.svg?1&#41;]&#40;https://hardhat.org&#41;)

# Hardhat Smart Compare

[Hardhat](https://hardhat.org) plugin to compare the contract storage layout and check for upgradability.

## What

This plugin helps you make a snapshot of hardhat storage layout and use it for comparison.

With this plugin you could do following:
* Compare snapshot with your current version of the smart contracts (SC)
* Compare snapshots between each other 
* Compare your current version of the SC with the remote version.

## Installation


```bash

npm install --save-dev @dlsl/hardhat-smart-compare

```


And add the following statement to your `hardhat.config.js`:


```js

require("@dlsl/hardhat-smart-compare");

```


Or, if you are using TypeScript, add this to your `hardhat.config.ts`:


```ts

import "@dlsl/hardhat-smart-compare";

```

## Tasks

- `compare` task, which allows you to ...

To view the available options, run the command (help command):
```bash
npx hardhat help compare 
```

## Environment extensions

This plugin does not extend the environment.

## Usage

You may add the following `migrate` config to your *hardhat config* file:

```js
module.exports = {
  smartCompare: {},
};

```

### Parameter explanation

## How it works

[//]: # (## Known limitations)
