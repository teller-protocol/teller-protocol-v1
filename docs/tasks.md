# Teller Tasks

There are a number of tasks (aka scripts) to help with the interaction of the protocol.

To see an updated list of available tasks currently supported either custom or imported from dependencies run:

- `yarn hh help`

A task is essentially just a function that can be run via terminal command line and is given a bunch of data and helpers to interact with the protocol.
All custom tasks are loaded from the `./tasks` directory.
These functions can also be exported as a module and be called directly from another script.

In order to execute a task run:

- `yarn hh {script-name} [options]`

[comment]: <> (## Advanced Tasks)

[comment]: <> (To read about a few advanced tasks click [here]&#40;./tasks-advanced.md&#41;.)

---

## Available Tasks

At the time of writing this, these are a list of all the available tasks.

### add-authorized-account

```shell
yarn hh add-authorized-account --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] add-authorized-account --account <STRING>

OPTIONS:

--account     Account to grant authorization

add-authorized-account: Adds the AUTHORIZED role to an account
```

### add-nft-merkles

```shell
yarn hh add-nft-merkles --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] add-nft-merkles [--send-tx]

OPTIONS:

  --send-tx     Required flag to ensure this is not ran on accident

add-nft-merkles: Generates and adds the merkles defined in the config file (./config/nft.ts) to the Teller NFT Distributor
```

### add-nft-tiers

```shell
yarn hh add-nft-tiers --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] add-nft-tiers [--send-tx]

OPTIONS:

  --send-tx     Required flag to ensure this is not ran on accident

add-nft-tiers: Saves the tier information in the config file ("./config/nft.ts") directly to the NFT
```

### claim-nft

```shell
yarn hh claim-nft --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] claim-nft --account <STRING> --merkle-index <STRING> [--send-tx]

OPTIONS:

  --account             Address to claim NFTs for
  --merkle-index        Only claim tokens using the specified merkle index.
  --send-tx             Required flag to ensure this is not ran on accident

claim-nft: Claims an NFT on behalf of an account
```

### clean

```shell
yarn hh clean --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] clean [--global]

OPTIONS:

  --global      Clear the global cache

clean: Clears the cache and deletes all artifacts
```

### compile

```shell
yarn hh compile --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] compile [--force] [--quiet]

OPTIONS:

  --force       Force compilation ignoring cache
  --quiet       Makes the compilation process less verbose

compile: Compiles the entire project, building all artifacts
```

### console

```shell
yarn hh console --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] console [--no-compile]

OPTIONS:

  --no-compile  Don't compile before running this task

console: Opens a hardhat console
```

### deploy

```shell
yarn hh deploy --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] deploy --deploy-scripts <STRING> --export <STRING> --export-all <STRING> --gasprice <STRING> [--no-compile] [--no-impersonation] [--reset] [--silent] --tags <STRING> [--watch] --write <BOOLEAN>

OPTIONS:

  --deploy-scripts      override deploy script folder path
  --export              export current network deployments
  --export-all          export all deployments into one file
  --gasprice            gas price to use for transactions
  --no-compile          disable pre compilation
  --no-impersonation    do not impersonate unknown accounts
  --reset               whether to delete deployments files first
  --silent              whether to remove log
  --tags                specify which deploy script to execute via tags, separated by commas
  --watch               redeploy on every change of contract or deploy script
  --write               whether to write deployments to file

deploy: Deploy contracts
```

### etherscan-verify

```shell
yarn hh etherscan-verify --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] etherscan-verify --api-key <STRING> [--force-license] --license <STRING> [--solc-input]

OPTIONS:

  --api-key             etherscan api key
  --force-license       force the use of the license specified by --license option
  --license             SPDX license (useful if SPDX is not listed in the sources), need to be supported by etherscan: https://etherscan.io/contract-license-types
  --solc-input          fallback on solc-input (useful when etherscan fails on the minimum sources, see https://github.com/ethereum/solidity/issues/9573)

etherscan-verify: submit contract source code to etherscan
```

### export

```shell
yarn hh export --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] export --export <STRING> --export-all <STRING>

OPTIONS:

  --export      export current network deployments
  --export-all  export all deployments into one file

export: export contract deployment of the specified network into one file
```

### export-artifacts

```shell
yarn hh export-artifacts --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] export-artifacts --exclude <STRING> --include <STRING> [--solc-input] dest

OPTIONS:

  --exclude     list of contract names separated by commas to exclude
  --include     list of contract names separated by commas to include. If specified, only these will be considered
  --solc-input  if set, artifacts will have an associated solcInput files (required for old version of solidity to ensure verifiability

POSITIONAL ARGUMENTS:

  dest  destination folder where the extended artifacts files will be written to

export-artifacts:
```

### flatten

```shell
yarn hh flatten --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] flatten ...files

POSITIONAL ARGUMENTS:

  files The files to flatten

flatten: Flattens and prints contracts and their dependencies
```

### get-price

```shell
yarn hh get-price --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] get-price --amount <FLOAT> --dst <STRING> --src <STRING>

OPTIONS:

  --amount      The amount to get the value for
  --dst         The destination token symbol
  --src         The source token symbol

get-price: Gets the value for a given token in terms of another
```

### node

```shell
yarn hh node --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] node --as-network <STRING> --export <STRING> --export-all <STRING> --fork <STRING> --fork-block-number <INT> [--fork-deployments <STRING>] --gasprice <STRING> --hostname <STRING> [--no-deploy] [--no-impersonation] [--no-reset] [--port <INT>] [--show-accounts] [--silent] --tags <STRING> [--watch] [--write <BOOLEAN>]

OPTIONS:

  --as-network          network name to be used, default to "localhost" (or to `--fork-deployments` value)
  --export              export current network deployments
  --export-all          export all deployments into one file
  --fork                The URL of the JSON-RPC server to fork from
  --fork-block-number   The block number to fork from
  --fork-deployments    this will use deployment from the named network, default to "localhost" (default: "localhost")
  --gasprice            gas price to use for transactions
  --hostname            The host to which to bind to for new connections (Defaults to 127.0.0.1 running locally, and 0.0.0.0 in Docker)
  --no-deploy           do not deploy
  --no-impersonation    do not impersonate unknown accounts
  --no-reset            do not delete deployments files already present
  --port                The port on which to listen for new connections (default: 8545)
  --show-accounts       display account addresses and private keys
  --silent              whether to renove log
  --tags                specify which deploy script to execute via tags, separated by commas
  --watch               redeploy on every change of contract or deploy script
  --write               whether to write deployments to file (default: true)

node: Starts a JSON-RPC server on top of Hardhat EVM
```

### pause-protocol

```shell
yarn hh pause-protocol --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] pause-protocol --id <STRING> [--state <BOOLEAN>]

OPTIONS:

  --id          A specific id of the Teller Protocol to pause
  --state       Indicate what paused state the protocol should be in (default: true)

pause-protocol: Pause the whole Teller Protocol or a specific ID
```

### run

```shell
yarn hh run --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] run [--no-compile] script

OPTIONS:

  --no-compile  Don't compile before running this task

POSITIONAL ARGUMENTS:

  script        A js file to be run within hardhat's environment

run: Runs a user-defined script after compiling the project
```

### set-nft-loan-merkle

```shell
yarn hh set-nft-loan-merkle --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] set-nft-loan-merkle --output <STRING> [--send-tx]

OPTIONS:

  --output      Path to file to output merkle proofs
  --send-tx     Required flag to ensure this is not ran on accident

set-nft-loan-merkle: Generates and sets the merkle used to verify NFT loan sizes while taking out a loan
```

### size-contracts

```shell
yarn hh size-contracts --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] size-contracts

size-contracts: Output the size of compiled contracts
```

### sourcify

```shell
yarn hh sourcify --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] sourcify --endpoint <STRING> [--write-failing-metadata]

OPTIONS:

  --endpoint                    endpoint url for sourcify
  --write-failing-metadata      write to disk failing metadata for easy debugging

sourcify: submit contract source code to sourcify (https://sourcify.dev)
```

### tenderly-contracts

```shell
yarn hh tenderly-contracts --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] tenderly-contracts

tenderly-contracts: Verifies and pushes all deployed contracts to Tenderly
```

### tenderly:push

```shell
yarn hh tenderly:push --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] tenderly:push ...contracts

POSITIONAL ARGUMENTS:

  contracts     Addresses and names of contracts that will be verified formatted ContractName=Address

tenderly:push: Privately pushes contracts to Tenderly
```

### tenderly:verify

```shell
yarn hh tenderly:verify --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] tenderly:verify ...contracts

POSITIONAL ARGUMENTS:

  contracts     Addresses and names of contracts that will be verified formatted ContractName=Address

tenderly:verify: Verifies contracts on Tenderly
```

### test

```shell
yarn hh test --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] test [--deploy-fixture] [--no-compile] [--no-impersonation] [...testFiles]

OPTIONS:

  --deploy-fixture      run the global fixture before tests
  --no-compile          Don't compile before running this task
  --no-impersonation    do not impersonate unknown accounts

POSITIONAL ARGUMENTS:

  testFiles     An optional list of files to test (default: [])

test: Runs mocha tests
```

### update-platform-setting

```shell
yarn hh update-platform-setting --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] update-platform-setting --name <STRING> [--value <INT>]

OPTIONS:

  --name        Name of the platform setting
  --value       Value to update the setting to (default: null)

update-platform-setting: Updates a platform setting value
```

### view-nfts

```shell
yarn hh view-nfts --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] view-nfts --account <STRING> [--claimable] [--claimed] --tier <STRING>

OPTIONS:

  --account     Address to view NFTs for
  --claimable   Only display info about NFTs that are yet to be claimed
  --claimed     Only display info about NFTs that have ALREADY been claimed
  --tier        A tier index to view NFTs for

view-nfts: Retrieve information about NFTs on the blockchain
```

### view-platform-setting

```shell
yarn hh view-platform-setting --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] view-platform-setting --name <STRING>

OPTIONS:

  --name        Get a specific platform setting

view-platform-setting: Lists the current platform settings
```

### stats

```shell
yarn hh stats --help
Hardhat version 2.3.0

Usage: hardhat [GLOBAL OPTIONS] stats

stats: Prints out current stats about the DAI market
```
