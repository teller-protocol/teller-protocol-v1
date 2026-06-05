import '@nomicfoundation/hardhat-chai-matchers'
import '@nomicfoundation/hardhat-ethers'
import '@tenderly/hardhat-tenderly'
import 'hardhat-contract-sizer'
import 'hardhat-deploy'
import 'hardhat-gas-reporter'

import { config } from 'dotenv'
import { ethers } from 'ethers'
import fs from 'fs'
import { HardhatUserConfig } from 'hardhat/config'
import {
  HardhatNetworkHDAccountsUserConfig,
  HardhatNetworkUserConfig,
  NetworkUserConfig,
  HardhatNetworkAccountUserConfig,
} from 'hardhat/types'
import path from 'path'

config()

const {
  KOVAN_RPC_URL,
  RINKEBY_RPC_URL,
  ROPSTEN_RPC_URL,
  MAINNET_RPC_URL,
  COMPILING,
  CMC_KEY,
  ETHERSCAN_API_KEY,
  INFURA_KEY,
  FORKING_NETWORK,
  MATIC_MAINNET_RPC_URL,
  MATIC_MUMBAI_RPC_URL,
  MNEMONIC_KEY,
  DEPLOYER_PRIVATE_KEY,
  SAFE_GLOBAL_API_KEY,
  SAVE_GAS_REPORT,
  TESTING,
} = process.env

if (COMPILING != 'true') {
  require('./tasks')
  require('./utils/hre-extensions')
}
let isTesting = false
if (TESTING === '1') {
  isTesting = true

  require('./test/helpers/chai-helpers')
}

const defaultBalance = ethers.parseEther('100000000').toString()

const hardhatAccounts = DEPLOYER_PRIVATE_KEY
  ? [{ privateKey: DEPLOYER_PRIVATE_KEY, balance: defaultBalance }]
  : {
      mnemonic: MNEMONIC_KEY,
      count: 15,
      accountsBalance: defaultBalance,
    }

const liveAccounts: string[] | HardhatNetworkHDAccountsUserConfig = DEPLOYER_PRIVATE_KEY
  ? [DEPLOYER_PRIVATE_KEY]
  : {
      mnemonic: MNEMONIC_KEY,
      count: 15,
      accountsBalance: defaultBalance,
    }

const GAS: HardhatNetworkUserConfig['gas'] = 'auto'

const networkUrls: { [network: string]: string } = {
  kovan: KOVAN_RPC_URL!,
  rinkeby: RINKEBY_RPC_URL!,
  ropsten: ROPSTEN_RPC_URL!,
  mainnet: MAINNET_RPC_URL!,
  polygon: MATIC_MAINNET_RPC_URL!,
  polygon_mumbai: MATIC_MUMBAI_RPC_URL!,
}

const getLatestDeploymentBlock = (networkName: string): number | undefined => {
  try {
    return parseInt(
      fs
        .readFileSync(
          path.resolve(
            __dirname,
            'deployments',
            networkName,
            '.latestDeploymentBlock'
          )
        )
        .toString()
    )
  } catch {
    // Network deployment does not exist
  }
}

const networkConfig = (config: NetworkUserConfig): NetworkUserConfig => ({
  ...config,
  accounts: liveAccounts,
  gas: GAS,
})

const hardhatNetworkConfig = (
  config: HardhatNetworkUserConfig
): HardhatNetworkUserConfig => ({
  ...config,
  accounts: hardhatAccounts,
  gas: GAS,
})

// Live (HTTP) networks keyed by name with their chainId. A network is only
// registered if its RPC URL is configured via the environment — skipping the
// rest avoids Hardhat's "networks.<x>.url - Expected a value of type string"
// validation crash. Using an unconfigured network then fails with a clear
// "network <x> is not defined" error instead.
const liveNetworkChainIds: { [name: string]: number } = {
  kovan: 42,
  rinkeby: 4,
  ropsten: 3,
  mainnet: 1,
  polygon: 137,
  polygon_mumbai: 80001,
}

const liveNetworks: { [name: string]: NetworkUserConfig } = {}
for (const [name, chainId] of Object.entries(liveNetworkChainIds)) {
  const url = networkUrls[name]
  if (url) liveNetworks[name] = networkConfig({ url, chainId, live: true })
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export default <HardhatUserConfig>{
  safe_api: {
    apiKey: SAFE_GLOBAL_API_KEY,
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  tenderly: {
    username: 'soltel',
    project: '{see utils/hre-extensions.ts}',
  },
  paths: {
    sources: 'contracts',
  },
  external: {
    contracts: [
      {
        artifacts: 'node_modules/hardhat-deploy/extendedArtifacts',
      },
      {
        artifacts: 'node_modules/@openzeppelin/contracts/build/contracts',
      },
    ],
  },
  solidity: {
    compilers: [
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: !isTesting,
            runs: 200,
          },
        },
      },
    ],
  },
  contractSizer: {
    runOnCompile: !!COMPILING,
    alphaSort: false,
    disambiguatePaths: false,
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    coinmarketcap: CMC_KEY,
    outputFile: SAVE_GAS_REPORT ? 'gas-reporter.txt' : undefined,
    noColors: !!SAVE_GAS_REPORT,
    showMethodSig: false,
    showTimeSpent: true,
  },
  namedAccounts: {
    deployer: 0,
    lender: {
      hardhat: 5,
      localhost: 5,
    },
    lender2: {
      hardhat: 6,
      localhost: 6,
    },
    borrower: {
      hardhat: 7,
      localhost: 7,
    },
    liquidator: {
      hardhat: 9,
      localhost: 9,
    },
    funder: {
      hardhat: 14,
      localhost: 14,
    },
    craSigner: {
      hardhat: 10,
      localhost: 10,
    },
    attacker: {
      hardhat: 11,
      localhost: 11,
    },
    safeAddress: {
      mainnet: '0x9E3bfee4C6b4D28b5113E4786A1D9812eB3D2Db6',
      polygon: '0xFea0FB908E31567CaB641865212cF76BE824D848',
    },
  },
  networks: {
    ...liveNetworks,
    hardhat: hardhatNetworkConfig({
      chainId: 31337,
      live: false,
      allowUnlimitedContractSize: true,
      forking:
        FORKING_NETWORK == null
          ? undefined
          : {
              enabled: true,
              url: networkUrls[FORKING_NETWORK],
              blockNumber: getLatestDeploymentBlock(FORKING_NETWORK),
            },
    }),
    localhost: networkConfig({
      url: 'http://127.0.0.1:8545',
      timeout: 10000000,
    }),
  },
  mocha: {
    timeout: 10000000,
  },
}
