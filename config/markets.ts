import { Market } from '../types/custom/config-types'

const mainnetMarkets: Market[] = [
  {
    lendingToken: 'DAI',
    collateralTokens: ['WETH'],
  },
]

export const markets: Record<string, Market[]> = {
  kovan: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['WETH'],
    },
  ],
  rinkeby: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['WETH'],
    },
  ],
  ropsten: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['WETH'],
    },
  ],
  hardhat: mainnetMarkets,
  localhost: mainnetMarkets,
  mainnet: mainnetMarkets,
}
