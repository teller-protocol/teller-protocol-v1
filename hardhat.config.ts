import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-contract-sizer'
import 'hardhat-deploy'
import 'hardhat-gas-reporter'

import { config } from 'dotenv'
import { BigNumber as BN, ethers } from 'ethers'
import { HardhatUserConfig } from 'hardhat/config'
import {
  HardhatNetworkHDAccountsUserConfig,
  HardhatNetworkUserConfig,
} from 'hardhat/types'

if (process.env.COMPILING != 'true') {
  require('./tasks')
  require('./utils/hre-extensions')
}

config()

const accounts: HardhatNetworkHDAccountsUserConfig = {
  mnemonic: process.env.MNEMONIC_KEY,
  count: parseInt(process.env.ADDRESS_COUNT_KEY ?? '15'),
  accountsBalance: ethers.utils.parseEther('1000000').toString(),
}

const GAS: HardhatNetworkUserConfig['gas'] = 'auto'

const GAS_PRICE: HardhatNetworkUserConfig['gasPrice'] = process.env
  .GAS_PRICE_GWEI_KEY
  ? BN.from(
      ethers.utils.parseUnits(process.env.GAS_PRICE_GWEI_KEY, 'gwei')
    ).toNumber()
  : 'auto'

const FORKING_NETWORK = process.env.FORKING_NETWORK ?? 'mainnet'
const FORK_BLOCK_NUMBER = process.env.FORKING_BLOCK
  ? parseInt(process.env.FORKING_BLOCK)
  : FORKING_NETWORK === 'mainnet'
  ? 12250227
  : undefined

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export default <HardhatUserConfig>{
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    sources: 'contracts',
  },
  external: {
    contracts: [
      {
        artifacts: 'node_modules/@openzeppelin/contracts/build/contracts',
      },
    ],
  },
  solidity: {
    compilers: [
      {
        version: '0.8.3',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  contractSizer: {
    runOnCompile: !!process.env.COMPILING,
    alphaSort: false,
    disambiguatePaths: false,
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: process.env.CMC_KEY,
    outputFile: process.env.SAVE_GAS_REPORT ? 'gas-reporter.txt' : undefined,
    noColors: !!process.env.SAVE_GAS_REPORT,
    showMethodSig: false,
    showTimeSpent: true,
  },
  namedAccounts: {
    deployer: {
      rinkeby: 0,
      ropsten: 0,
      hardhat: 0,
      localhost: 0,
      mainnet: 0,
    },
    lender: {
      hardhat: 5,
      localhost: 5,
    },
    borrower: {
      hardhat: 6,
      localhost: 6,
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
  },
  networks: {
    rinkeby: {
      url: process.env.ALCHEMY_RINKEBY_KEY,
      chainId: 4,
      accounts,
      gas: GAS,
      gasPrice:
        GAS_PRICE === 'auto' ? GAS_PRICE : BN.from(GAS_PRICE).div(4).toNumber(),
    },
    ropsten: {
      url: process.env.ALCHEMY_ROPSTEN_KEY,
      accounts,
      gas: GAS,
      gasPrice:
        GAS_PRICE === 'auto' ? GAS_PRICE : BN.from(GAS_PRICE).div(4).toNumber(),
    },
    hardhat: {
      forking: {
        url: process.env[`ALCHEMY_${FORKING_NETWORK.toUpperCase()}_KEY`],
        // Block to fork can be specified via cli: `yarn h fork {network} ([block number] | latest)`
        // Defaults to the latest deployment block
        blockNumber: FORK_BLOCK_NUMBER,
        enabled: true,
      },
      forkName: FORKING_NETWORK,
      accounts,
      gasPrice: GAS_PRICE,
    },
    // Uses the forked node from the hardhat network above
    localhost: {
      url: 'http://127.0.0.1:8545',
      forkName: FORKING_NETWORK,
      accounts,
      timeout: 100000,
      gasPrice: GAS_PRICE,
    },
    mainnet: {
      url: process.env.ALCHEMY_MAINNET_KEY,
      chainId: 1,
      accounts,
      gas: GAS,
      gasPrice: GAS_PRICE,
    },
  },
  mocha: {
    timeout: 100000,
  },
}
