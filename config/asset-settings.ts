import { AssetSettings, Config, Network } from '../types/custom/config-types'

const assetSettingsConfigsByNetwork: Config<AssetSettings> = {
  kovan: {
    DAI: {
      cToken: 'CDAI',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000
    },
    USDC: {
      cToken: 'CUSDC',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000
    },
    ETH: {
      cToken: 'CETH',
      maxLoanAmount: 0,
      maxTVLAmount: 0
    }
  },
  rinkeby: {
    DAI: {
      cToken: 'CDAI',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000
    },
    USDC: {
      cToken: 'CUSDC',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000
    },
    ETH: {
      cToken: 'CETH',
      maxLoanAmount: 0,
      maxTVLAmount: 0
    }
  },
  ropsten: {
    DAI: {
      cToken: 'CDAI',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000
    },
    USDC: {
      cToken: 'CUSDC',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000
    },
    ETH: {
      cToken: 'CETH',
      maxLoanAmount: 0,
      maxTVLAmount: 0
    }
  },
  hardhat: {
    DAI: {
      cToken: 'CDAI',
      maxLoanAmount: 10000,
      maxTVLAmount: 100000
    },
    USDC: {
      cToken: 'CUSDC',
      maxLoanAmount: 10000,
      maxTVLAmount: 100000
    },
    ETH: {
      cToken: 'CETH',
      maxLoanAmount: 0,
      maxTVLAmount: 0
    }
  },
  mainnet: {
    DAI: {
      cToken: 'CDAI',
      maxLoanAmount: 10000,
      maxTVLAmount: 100000
    },
    USDC: {
      cToken: 'CUSDC',
      maxLoanAmount: 10000,
      maxTVLAmount: 100000
    },
    ETH: {
      cToken: 'CETH',
      maxLoanAmount: 0,
      maxTVLAmount: 0
    }
  }
}

export const getAssetSettings = (network: Network) => assetSettingsConfigsByNetwork[network]
