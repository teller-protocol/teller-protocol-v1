import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-deploy'
import { HardhatUserConfig } from 'hardhat/config'
import { config } from 'dotenv'
import { HardhatNetworkHDAccountsUserConfig } from 'hardhat/types'

config()

const accounts: HardhatNetworkHDAccountsUserConfig = {
  mnemonic: process.env.MNEMONIC_KEY,
  count: parseInt(process.env.ADDRESS_COUNT_KEY ?? '15')
}

export default <HardhatUserConfig>{
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  solidity: {
    version: '0.5.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  namedAccounts: {
    deployer: {
      rinkeby: 1,
      ropsten: 1,
      hardhat: 1,
      localhost: 1,
      mainnet: 1
    }
  },
  networks: {
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 4,
      accounts
      // gas: gasKeyValue,
      // gasPrice: web3.utils.toWei(gasPriceKeyValue, 'gwei'),
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts
      // gas: gasKeyValue,
      // gasPrice: web3.utils.toWei(gasPriceKeyValue, 'gwei'),
    },
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
        blockNumber: 11806209,
        enabled: true
      },
      chainId: 1,
      accounts
    },
    // Uses the forked node from the hardhat network above
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 1,
      accounts
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      chainId: 1,
      accounts
      // gas: gasKeyValue,
      // gasPrice: web3.utils.toWei(gasPriceKeyValue, 'gwei'),
    }
  }
}
