import { Market } from '../types/custom/config-types'

const mainnetMarkets: Market[] = [
  {
    borrowedToken: 'DAI',
    collateralToken: 'ETH',
  },
]

export const markets: Record<string, Market[]> = {
  kovan: [
    {
      borrowedToken: 'DAI',
      collateralToken: 'ETH',
    },
  ],
  rinkeby: [
    {
      borrowedToken: 'DAI',
      collateralToken: 'ETH',
    },
  ],
  ropsten: [
    {
      borrowedToken: 'DAI',
      collateralToken: 'ETH',
    },
  ],
  hardhat: mainnetMarkets,
  localhost: mainnetMarkets,
  mainnet: mainnetMarkets,
}
