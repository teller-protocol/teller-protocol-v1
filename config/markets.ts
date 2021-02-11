import { Config, Market, Network } from '../types/custom/config-types'

const mainnetMarkets: Market[] = [
  {
    borrowedToken: 'DAI',
    collateralToken: 'ETH'
  }
  // {
  //   borrowedToken: "DAI",
  //   collateralToken: "LINK"
  // },
  // {
  //   borrowedToken: "USDC",
  //   collateralToken: "ETH"
  // },
  // {
  //   borrowedToken: "USDC",
  //   collateralToken: "LINK"
  // }
]

const marketsConfigsByNetwork: Config<Market[]> = {
  kovan: [
    {
      borrowedToken: 'DAI',
      collateralToken: 'ETH'
    },
    {
      borrowedToken: 'DAI',
      collateralToken: 'LINK'
    },
    {
      borrowedToken: 'USDC',
      collateralToken: 'ETH'
    },
    {
      borrowedToken: 'USDC',
      collateralToken: 'LINK'
    }
  ],
  rinkeby: [
    {
      borrowedToken: 'DAI',
      collateralToken: 'ETH'
    },
    {
      borrowedToken: 'DAI',
      collateralToken: 'LINK'
    },
    {
      borrowedToken: 'USDC',
      collateralToken: 'ETH'
    },
    {
      borrowedToken: 'USDC',
      collateralToken: 'LINK'
    }
  ],
  ropsten: [
    {
      borrowedToken: 'DAI',
      collateralToken: 'ETH'
    },
    {
      borrowedToken: 'DAI',
      collateralToken: 'LINK'
    },
    {
      borrowedToken: 'USDC',
      collateralToken: 'ETH'
    },
    {
      borrowedToken: 'USDC',
      collateralToken: 'LINK'
    }
  ],
  hardhat: mainnetMarkets,
  localhost: mainnetMarkets,
  mainnet: mainnetMarkets
}

export const getMarkets = (network: Network) => marketsConfigsByNetwork[network]
