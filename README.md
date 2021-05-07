# Teller V1 Protocol

Teller V1 is a composition of smart contracts, which create the protocol. These contracts enable digital asset holders on the Ethereum blockchain to engage in decentralized, lending and borrowing activities, with down to zero collateral.

The protocol is currently in beta and deployed on the Ropsten testnet. We envision the protocol to evolve into a decentralized, community-run project, maintained by a DAO (Decentralized Autonomous Organization) structure.

To expand the possibilities of undercollateralized DeFi, we are exploring integrations with [Stratosphere Network](https://www.stratosphere.network/). Interoperability with the Stratosphere Blockchain will enable the project to tie directly into the benefits of major cloud resources while maintaining decentralization.

If you would like to contribute, we encourage you to submit a PR directly or join the open-source team at hello@teller.finance.

## Resources

- Website → https://teller.finance/
- Twitter → https://twitter.com/useteller
- Discord → https://discord.com/invite/Ujnvh8d

## Prerequisites

### NodeJS Version

To avoid any issue with the NodeJS version, please check it before continuing. It should be >= _v10.15.3_ and =< _lts/dubnium / v10.21.0_.

### Install Dependencies

To make the development process easier, we use [Hardhat](https://hardhat.org/) as a dependency in the project.

### Create a `.ENV` file

<a name="readme-create-env-file"></a>

You already have a `.env.template` in the root folder. Just copy/paste the `.env.template` file, and create the `.env` in the root folder.

Most of the environment variables already have a default value in the template file.

You only need to set/modify the following ones if you want to use a testnet or mainnet networks:

The alchemy keys are is used to deploy smart contracts on their respective networks

- ALCHEMY_MAINNET_KEY
- ALCHEMY_RINKEBY_KEY
- ALCHEMY_ROPSTEN_KEY
- ALCHEMY_KOVAN_KEY
- _INFURA_KEY_: This is used to deploy smart contracts on a testnet or mainnet.
- _MNEMONIC_KEY_: This is used to deploy smart contracts on a network or interact with a network. **The default value is used to interact with Ganache locally.**

`NB: The Alchemy keys have to be the full alchemy network URL`

> This is important to have a stable NodeJS version installed. At the moment of writing this document, the team is using the NodeJS _lts/dubnium / vv14.15.4_ without issues.

## Get Started

<a name="readme-get-started"></a>

To get started, you need to install the dependencies:

- Using Yarn: `yarn install`

`NB: you should only use yarn in conjunction with the yarn.lock file`

After checking the prerequisites, you are able to execute the unit tests, and code coverage.

To create a localhost network:

Hardhat creates a local ganache instance and deploys all contracts to that instance. To verify if instances have been deployed, check `deployments/localhost`

- Using Hardhat: `npx hardhat node`

### Running Unit Tests

Execute the command:

`yarn test`

As result, you should see:

![Unit Tests](docs/images/get-started/unit-tests-result.png)

### Running Code Coverage

Execute:

`yarn test:coverage`

As result, you should see:

![Code Coverage Tests](docs/images/get-started/test-coverage-result.png)

## Extra Resources

- To execute integration tests follow [this guide](./docs/integration-tests.md).
- To execute scripts on Ethereum networks follow [this guide](./docs/truffle-scripts.md).
- To learn more about Teller Protocol check our documentation [here](https://teller.gitbook.io/teller-1/).
- To configure a new Chainlink Oracle [here](./docs/chainlink-configuration.md).

---

© Copyright 2021, Teller
