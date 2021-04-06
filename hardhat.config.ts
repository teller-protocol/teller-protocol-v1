import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import { config } from 'dotenv'
import { BigNumber as BN, ethers } from 'ethers'
import 'hardhat-contract-sizer'
import 'hardhat-deploy'
import 'hardhat-gas-reporter'
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

export default <HardhatUserConfig>{
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    sources: 'diamonds/domains/',
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
  external: {
    contracts: [
      {
        artifacts: 'node_modules/@openzeppelin/contracts/build/contracts',
      },
      {
        artifacts:
          'node_modules/@openzeppelin/contracts-upgradeable/build/contracts',
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
