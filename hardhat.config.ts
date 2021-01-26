import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import 'hardhat-typechain';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import { HardhatUserConfig } from 'hardhat/types';
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
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
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
  networks: {
    hardhat: {},
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
