# Zero Collateral V1 Protocol

Zero Collateral V1 is a composition of smart contracts, which create the protocol. These contracts enable digital asset holders on the Ethereum blockchain to engage in decentralized, lending and borrowing activities, with down to zero collateral.

The protocol is currently in beta and deployed on the Ropsten testnet. We envision the protocol to evolve into a decentralized, community-run project, maintained by a Zero Collateral DAO (Decentralized Autonomous Organization) structure.

To expand the possibilities of undercollateralized DeFi, we are exploring integrations with [Stratosphere Network](https://www.stratosphere.network/). Interoperability with the Stratosphere Blockchain will enable the project to tie directly into the benefits of major cloud resources while maintaining decentralization.

If you would like to contribute, we encourage you to submit a PR directly or join the open-source team at opensource@fabrx.io.

## Resources

Website → https://zerocollateral.com/
Twitter → https://twitter.com/zer0collateral 
Blog → https://medium.com/fabrx-blockchain
Discord → https://discord.gg/z3AJ9F

## Get Started

To get started, you need to install the dependencies:

- Using Yarn: ```yarn install```
- Using NPM: ```npm install```

### Verifying Versions

```sh
$ truffle version

Truffle v5.1.16 (core: 5.1.16)
Solidity - 0.5.17 (solc-js)
Node v10.15.3
Web3.js v1.2.1
```

> This is important to have installed a stable NodeJS version. At the moment of writing this document, the team is using the NodeJS *v10.15.3* and *v10.17.0* without issues.

After installing the dependencies and verifying the NodeJS version, you are able to execute the units tests, and code coverage.

### Running Unit Tests

Execute the command:

```yarn test```

As result, you should see:

![Unit Tests](docs/images/get-started/unit-tests-result.png)

### Running Code Coverage

Execute:

```yarn test:coverage```

As result, you should see:

![Code Coverage Tests](docs/images/get-started/test-coverage-result.png)

## Extra Resources

- To execute integration tests follow [this guide](./docs/integration-tests.md).

---
© Copyright 2020, Fabrx Labs
