import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-deploy';

import { HardhatUserConfig } from 'hardhat/config';

import configureEnv from './config/env';

const envConfig = configureEnv();

// Environment Configuration
const addressCountValue = envConfig.getAddressCount().getOrDefault();
const mnemonicKeyValue = envConfig.getMnemonic().get();
const infuraKeyValue = envConfig.getInfuraKey().get();
const gasKeyValue = envConfig.getGasWei().getOrDefault();
const gasPriceKeyValue = envConfig.getGasPriceGwei().getOrDefault();
const etherscanApiKey = envConfig.getEtherscanApiKey().get();

export default <HardhatUserConfig>{
  etherscan: {
    apiKey: etherscanApiKey,
  },
  solidity: {
    version: '0.5.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: {
      localhost: 1,
      hardhat: 1,
      rinkeby: 0,
      mainnet: 1,
    },
  },
  networks: {
    hardhat: {
      blockGasLimit: 999999999999,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/QmTWJK5MH1mmVSJdJ6VJFiX1Qfk6S36J`,
        blockNumber: 11806209,
        enabled: true,
      },
    },
    localhost: {
      gas: 10000000,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${infuraKeyValue}`,
      chainId: 4,
      // accounts: {
      //   mnemonic: mnemonicKeyValue,
      //   count: addressCountValue,
      // },
      // gas: gasKeyValue,
      // gasPrice: web3.utils.toWei(gasPriceKeyValue, 'gwei'),
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${infuraKeyValue}`,
      // accounts: {
      // mnemonic: mnemonicKeyValue,
      // count: addressCountValue,
      // },
      // gas: gasKeyValue,
      // gasPrice: web3.utils.toWei(gasPriceKeyValue, 'gwei'),
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${infuraKeyValue}`,
      // accounts: {
      // mnemonic: mnemonicKeyValue,
      // count: addressCountValue,
      // },
      // gas: gasKeyValue,
      // gasPrice: web3.utils.toWei(gasPriceKeyValue, 'gwei'),
    },
  },
};
