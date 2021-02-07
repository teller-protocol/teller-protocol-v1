export type AssetSetting = {
  cToken: string;
  maxLoanAmount: number;
  maxTVLAmount: number;
};

const assetSettingsConfigsByNetwork: Record<string, Record<string, AssetSetting>> = {
  mainnet: {
    DAI: {
      cToken: 'CDAI',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000,
    },
    USDC: {
      cToken: 'CUSDC',
      maxLoanAmount: 1000,
      maxTVLAmount: 100000,
    },
    ETH: {
      cToken: 'CETH',
      maxLoanAmount: 0,
      maxTVLAmount: 0,
    },
  },
};

export const assetSettings = (network: string) => assetSettingsConfigsByNetwork[network];
