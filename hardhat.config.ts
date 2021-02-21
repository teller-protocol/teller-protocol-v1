import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import { HardhatUserConfig } from 'hardhat/config'
import { config } from 'dotenv'
import { HardhatNetworkHDAccountsUserConfig } from 'hardhat/types'
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
}

export default <HardhatUserConfig>{
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
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
  contractSizer: {
    runOnCompile: false,
    alphaSort: true,
    disambiguatePaths: false,
  },
  namedAccounts: {
    deployer: {
      rinkeby: 1,
      ropsten: 1,
      hardhat: 1,
      localhost: 1,
      mainnet: 1,
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
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 4,
      accounts,
      // gas: gasKeyValue,
      // gasPrice: web3.utils.toWei(gasPriceKeyValue, 'gwei'),
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts,
      // gas: gasKeyValue,
      // gasPrice: web3.utils.toWei(gasPriceKeyValue, 'gwei'),
    },
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
        blockNumber: 11806209,
        enabled: true,
      },
      chainId: 1,
      accounts,
    },
    // Uses the forked node from the hardhat network above
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 1,
      accounts,
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      chainId: 1,
      accounts,
      // gas: gasKeyValue,
      // gasPrice: web3.utils.toWei(gasPriceKeyValue, 'gwei'),
    },
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 121,
  },
}
