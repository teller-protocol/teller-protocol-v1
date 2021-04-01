import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import { config } from 'dotenv'
import { ethers, BigNumber as BN } from 'ethers'
import { HardhatUserConfig } from 'hardhat/config'
import {
  HardhatNetworkHDAccountsUserConfig,
  HardhatNetworkUserConfig,
} from 'hardhat/types'
import 'hardhat-gas-reporter'
// import 'solidity-coverage'
import 'hardhat-contract-sizer'

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

export default <HardhatUserConfig>{
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
    compilers: [
      {
        version: '0.5.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            details: {
              // Removes duplicate code blocks
              deduplicate: true,
              // Common subexpression elimination, this is the most complicated step but
              // can also provide the largest gain.
              cse: true,
              // Optimize representation of literal numbers and strings in code.
              constantOptimizer: true,
              // Sometimes re-orders literals in commutative operations.
              orderLiterals: true,
              // The new Yul optimizer. Mostly operates on the code of ABIEncoderV2
              // and inline assembly. Had to be activated through this switch for
              // pre Solidity 0.6.0
              yul: true,
            },
          },
        },
      },
      {
        version: '0.8.3',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            details: {
              // Removes duplicate code blocks
              deduplicate: true,
              // Common subexpression elimination, this is the most complicated step but
              // can also provide the largest gain.
              cse: true,
              // Optimize representation of literal numbers and strings in code.
              constantOptimizer: true,
              // Sometimes re-orders literals in commutative operations.
              orderLiterals: true,
              // The new Yul optimizer. Mostly operates on the code of ABIEncoderV2
              // and inline assembly. Had to be activated through this switch for
              // pre Solidity 0.6.0
              yul: true,
            },
          },
        },
      },
    ],
  },
  contractSizer: {
    runOnCompile: false,
    alphaSort: true,
    disambiguatePaths: false,
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
      rinkeby: 5,
      ropsten: 5,
      hardhat: 5,
      localhost: 5,
    },
    borrower: {
      rinkeby: 6,
      ropsten: 6,
      hardhat: 6,
      localhost: 6,
    },
    liquidator: {
      rinkeby: 9,
      ropsten: 9,
      hardhat: 9,
      localhost: 9,
    },
    funder: {
      hardhat: 15,
      localhost: 15,
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
        url: process.env.ALCHEMY_MAINNET_KEY,
        blockNumber: 12064000,
        enabled: true,
      },
      accounts,
    },
    // Uses the forked node from the hardhat network above
    localhost: {
      url: 'http://127.0.0.1:8545',
      accounts,
    },
    mainnet: {
      url: process.env.ALCHEMY_MAINNET_KEY,
      chainId: 1,
      accounts,
      gas: GAS,
      gasPrice: GAS_PRICE,
    },
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: process.env.CMC_KEY,
    outputFile: process.env.SAVE_GAS_REPORT ? 'gas-reporter.txt' : undefined,
    noColors: !!process.env.SAVE_GAS_REPORT,
  },
  mocha: {
    timeout: 100000,
  },
}
