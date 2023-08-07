[//]: # ([![npm]&#40;https://img.shields.io/npm/v/@dlsl/hardhat-smart-compare.svg&#41;]&#40;https://www.npmjs.com/package/@dlsl/hardhat-smart-compare&#41; [![hardhat]&#40;https://hardhat.org/buidler-plugin-badge.svg?1&#41;]&#40;https://hardhat.org&#41;)

# Hardhat Smart Compare

[Hardhat](https://hardhat.org) plugin to compare contracts between upgrades to ensure storage compatibility. 

## What

This plugin generates a storage layout snapshot of the contracts in the project.
It is precious for upgradable systems, as it helps you verify that the storage layout of the proxy contracts 
remains unchanged after the upgrade is done.

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

There are two tasks:

* `storage:save` task, which allows you to save the snapshot of the storage layout.
* `storage:compare` task, which allows you to compare the current version of contracts with the previously saved snapshot.

To view the available options, run the command (help command):

```bash
npx hardhat help storage:save 
npx hardhat help storage:compare 
```

## Environment extensions

This plugin does not extend the environment.

## Usage

To make a snapshot of the storage layout, run the following command:

```bash
npx hardhat storage:save
```

To compare the current version of contracts with the previously saved snapshot, run the following command:

```bash
npx hardhat storage:compare
```

### How it works

The plugin completes the `compile` task, retrieves artifacts from the *Hardhat Runtime Environment (HRE)*, and performs the following actions depending on the task:

- `save`: 

It will parse the `build-info` file to get the compiler output and retrieve storage layout of contracts from the 
`outputSelection` field.
After that it will parse and save the storage layout for each contract with an inheritance "map" in a JSON file.

- `compare`:

Initially, it will execute the same steps as the `save` task. 
It will then thoroughly compare the existing snapshot and the newly generated version, scrutinizing each field and type. 
Ultimately, if the `--print-diff` flag is provided, it will display any differences that were identified.

### Configuration

The default configuration looks as follows. You may customize all fields in your **hardhat config** file.

```js
module.exports = {
  compare: {
    snapshotPath: "./storage_snapshots",
    snapshotFileName: "storage_snapshot.json",
  },
};
```

### Parameter explanation

* `snapshotPath`: Path to the directory where the storage layout snapshot is saved.
* `snapshotFileName`: File name of the snapshot.

## Known limitations

* Doesn't detect non-storage variables changes.
* Printed results are hard to comprehend.
* `Vyper` is currently not supported.
