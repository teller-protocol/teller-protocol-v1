# Integration Tests

This document describes how to set up a local environment properly in order to execute integration tests.
It includes:

- A local Ganache instance.
- A local TheGraph node.
- Finally, a subgraph deployed on the local TheGraph node (see details [here](https://thegraph.com/)).

## Required Repositories

Before describing the steps, please, check you already have cloned the following repositories:

- **[Smart contracts](https://github.com/Zero-Collateral/zero-collateral-v1):** *This is the current repository. It contains all the official smart contracts and configuration for all networks (including Ganache, mainnet, and testnet) where the platform was deployed.*.

  - ```git clone git@github.com:Zero-Collateral/zero-collateral-v1.git```

- **[Subgraph](https://github.com/Zero-Collateral/subgraph.git):** *This repository is based on [The Graph protocol](https://thegraph.com), and listens all the smart contract events, and save the data into a GraphQL server.*

  - ```git clone git@github.com:Zero-Collateral/subgraph.git```
  - ```yarn install``` in the root folder.

- **[Our own TheGraph node](https://github.com/Zero-Collateral/graph-node)**: *This repository is used to create a local TheGraph node using a script (.sh) file. So, it can be executed repeatedly without the need to remove the data generated in the Docker volume folders.*

  - ```git clone git@github.com:Zero-Collateral/graph-node.git```

## Prerequisites

Before continuing with the next steps, please, check you already have completed:

- The *Get Started* steps detailed in [README.md](../README.md) file.
- The steps to clone the required repositories.

## Steps

The following steps will allow you to have:

- A local Ganache instance.
- A local The Graph node.
- Our subgraph deployed on the local The Graph node.

Finally, you will able to execute the integration tests (or scripts) on the local Ganache instance and see the data on the deployed subgraph on The Graph.

## Setup

1- Start a local Ganache instance (using Docker).

> The current command will unzip a ZIP file into a specific folder. This execution might throw an error depending on the OS.
> It requires to have installed the ```unzip``` command.
>  
> - If you use Linux: ```sudo apt-get install unzip```
> - If you use Windows, this process doesn't work on PowerShell. You need to install WSL2 (Windows Subsystem Linux v2). See more details [here](https://devblogs.microsoft.com/commandline/wsl2-will-be-generally-available-in-windows-10-version-2004/).

In a new command window, go to the folder where you cloned the *Smart Contract* repository (***this repository***), and execute:

```sh
yarn start:ganache:docker
```

As result, you should see:

![Start Ganache Using Docker](./images/integration-tests/yarn-start-ganache-docker.png)

> Please, **DON'T use** the pre-configured mnemonic in a production environment. It is **ONLY** for local testing purposes.

You already have a Ganache instance running locally.

2- Start a local TheGraph node.

In a new command window, go to the folder where you cloned the *Our own TheGraph node* repository, and within **graph-node/docker** folder execute:

```sh
./run-node-graph.sh
```

> It might ask you to type your password in the starting process. Just, type your password, and press Enter.

After some seconds, you should see:

![Start Ganache Using Docker](./images/integration-tests/start-thegraph-node.png)

3- Deploy the subgraph on the local TheGraph node.

At the final of the process, you will deploy the subgraph on the The Graph node locally, and it will process all the events from your smart contract transactions.

In a new command window, go to the folder where you cloned the **Subgraph** repository, and in the **root** folder, execute:

```sh
yarn deploy:ganache
```

> Note: Remember you should have executed the ```yarn install``` before deploying it on Ganache.

> You might see an error in the console with the following message:
>
> ```sh
> ✖ Error removing the subgraph: subgraph name not found: zero-collateral/zero-collateral
> error Command failed with exit code 1.
> ```
>
> **Don't panic**. This error is due to the process is trying to remove the subgraph, but it doesn't exist. It is used in a development mode (when you deploy it several times without restart the The Graph node).

As result, you should see:

![Start Ganache Using Docker](./images/integration-tests/yarn-deploy-ganache.png)

Congrats! You already finished the configuration!

You can visit the [local URL](http://127.0.0.1:8000/subgraphs/name/zero-collateral/zero-collateral/graphql) to access to the The Graph UI. It is very simple, but you can execute GraphQL queries to get data from your smart contract events.

Now, you are ready to run the integration tests. In a new command window, go to the folder where you cloned the **Smart Contracts** repository, and in the **root** folder, execute::

```yarn test:ganache```

As result, you will see:

![Run Integration Tests](./images/integration-tests/run-integration-tests.png)

Now, you can click on the [URL](http://127.0.0.1:8000/subgraphs/name/zero-collateral/zero-collateral/graphql) where the subgraph was deployed, and execute queries.

![TheGraph Localhost](./images/integration-tests/thegraph-localhost.png)

Enjoy it!
