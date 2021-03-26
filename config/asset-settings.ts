import { AssetSettings, Config, Network } from '../types/custom/config-types'

const mainnetAssetSettings: AssetSettings = {
  DAI: {
    cToken: 'CDAI',
    aToken: 'ADAI',
    yVault: 'YDAI',
    pPool: 'PCDAI',
    maxLoanAmount: 10000,
    maxTVLAmount: 100000,
    maxDebtRatio: 5000,
  },
  USDC: {
    cToken: 'CUSDC',
    maxLoanAmount: 10000,
    maxTVLAmount: 100000,
    maxDebtRatio: 5000,
  },
  ETH: {
    cToken: 'CETH',
    maxLoanAmount: 0,
    maxTVLAmount: 0,
    maxDebtRatio: 5000,
  },
}

const assetSettingsConfigsByNetwork: Config<AssetSettings> = {
  kovan: {
    DAI: {
      cToken: 'CDAI',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000,
      maxDebtRatio: 5000,
    },
    USDC: {
      cToken: 'CUSDC',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000,
      maxDebtRatio: 5000,
    },
    ETH: {
      cToken: 'CETH',
      maxLoanAmount: 0,
      maxTVLAmount: 0,
      maxDebtRatio: 5000,
    },
  },
  rinkeby: {
    DAI: {
      cToken: 'CDAI',
      pPool: 'PCDAI',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000,
      maxDebtRatio: 5000,
    },
    USDC: {
      cToken: 'CUSDC',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000,
      maxDebtRatio: 5000,
    },
    ETH: {
      cToken: 'CETH',
      maxLoanAmount: 0,
      maxTVLAmount: 0,
      maxDebtRatio: 5000,
    },
  },
  ropsten: {
    DAI: {
      cToken: 'CDAI',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000,
      maxDebtRatio: 5000,
    },
    USDC: {
      cToken: 'CUSDC',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000,
      maxDebtRatio: 5000,
    },
    ETH: {
      cToken: 'CETH',
      maxLoanAmount: 0,
      maxTVLAmount: 0,
      maxDebtRatio: 5000,
    },
  },
  hardhat: mainnetAssetSettings,
  localhost: mainnetAssetSettings,
  mainnet: mainnetAssetSettings,
}

export const getAssetSettings = (network: Network) =>
  assetSettingsConfigsByNetwork[network]
