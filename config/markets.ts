const marketsConfigsByNetwork: Record<string, { borrowedToken: string; collateralToken: string }[]> = {
  mainnet: [
    {
      borrowedToken: 'DAI',
      collateralToken: 'ETH',
    },
  ],
};

export const markets = (network: string) => marketsConfigsByNetwork[network];
