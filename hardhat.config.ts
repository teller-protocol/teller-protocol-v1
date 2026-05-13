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
  ALCHEMY_KOVAN_KEY,
  ALCHEMY_RINKEBY_KEY,
  ALCHEMY_ROPSTEN_KEY,
  ALCHEMY_MAINNET_KEY,
  COMPILING,
  CMC_KEY,
  ETHERSCAN_API_KEY,
  INFURA_KEY,
  FORKING_NETWORK,
  MATIC_MAINNET_KEY,
  MATIC_MUMBAI_KEY,
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
  kovan: ALCHEMY_KOVAN_KEY!,
  rinkeby: ALCHEMY_RINKEBY_KEY!,
  ropsten: ALCHEMY_ROPSTEN_KEY!,
  mainnet: ALCHEMY_MAINNET_KEY!,
  polygon: MATIC_MAINNET_KEY!,
  polygon_mumbai: MATIC_MUMBAI_KEY!,
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
    kovan: networkConfig({
      url: networkUrls.kovan,
      chainId: 42,
      live: true,
    }),
    rinkeby: networkConfig({
      url: networkUrls.rinkeby,
      chainId: 4,
      live: true,
    }),
    ropsten: networkConfig({
      url: networkUrls.ropsten,
      chainId: 3,
      live: true,
    }),
    mainnet: networkConfig({
      url: networkUrls.mainnet,
      chainId: 1,
      live: true,
    }),
    polygon: networkConfig({
      url: networkUrls.polygon,
      chainId: 137,
      live: true,
    }),
    polygon_mumbai: networkConfig({
      url: networkUrls.polygon_mumbai,
      chainId: 80001,
      live: true,
    }),
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
