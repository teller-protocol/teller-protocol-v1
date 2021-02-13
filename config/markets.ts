import { Config, Market, Network } from '../types/custom/config-types'

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
  fork: [
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
  ],
  mainnet: [
    {
      borrowedToken: 'DAI',
      collateralToken: 'ETH'
    }
    // {
    //   borrowedToken: 'DAI',
    //   collateralToken: 'LINK'
    // },
    // {
    //   borrowedToken: 'USDC',
    //   collateralToken: 'ETH'
    // },
    // {
    //   borrowedToken: 'USDC',
    //   collateralToken: 'LINK'
    // }
  ]
}

export const getMarkets = (network: Network) => marketsConfigsByNetwork[network]
