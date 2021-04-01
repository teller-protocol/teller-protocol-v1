import { Config, Market, Network } from '../types/custom/config-types'

const mainnetMarkets: Market[] = [
  {
    borrowedToken: 'DAI',
    collateralToken: 'ETH',
  },
]

const marketsConfigsByNetwork: Config<Market[]> = {
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

export const getMarkets = (network: Network) => marketsConfigsByNetwork[network]
