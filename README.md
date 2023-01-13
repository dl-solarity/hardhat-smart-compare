[//]: # ([![npm]&#40;https://img.shields.io/npm/v/@dlsl/hardhat-smart-compare.svg&#41;]&#40;https://www.npmjs.com/package/@dlsl/hardhat-smart-compare&#41; [![hardhat]&#40;https://hardhat.org/buidler-plugin-badge.svg?1&#41;]&#40;https://hardhat.org&#41;)

# Hardhat Smart Compare

This [Hardhat](https://hardhat.org) plugin facilitate contract upgradability and provides various comparison tools.

## What

This plugin helps you make a snapshot of hardhat storage layout and use it for comparison.

With this plugin you could do the following:
* Compare snapshot with your current version of the smart contracts (SC)

[//]: # (* Compare snapshots between each other )

[//]: # (* Compare your current version of the SC with the remote version.)

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

- `storage:save` task, which allows you to save the snapshot of the storage layout.
- `storage:compare` task, which allows you to compare the current version of contracts with the previously saved snapshot.

To view the available options, run the command (help command):
```bash
npx hardhat help storage:save 
npx hardhat help storage:compare 
```

## Environment extensions

This plugin does not extend the environment.

## Usage

You may add the following `compare` config to your *hardhat config* file:

```js
module.exports = {
  compare: {
    snapshotPath: "./storage_snapshots",
    snapshotFileName: "storage_snapshot.json",
  },
};
```

### Parameter explanation

- `snapshotPath` : Path to the directory where the saved storage layout snapshot was saved.
- `snapshotFileName` : File name of the snapshot.

[//]: # (## How it works)

[//]: # (## Known limitations)
