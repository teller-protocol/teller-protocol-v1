import { Market } from '../types/custom/config-types'

const mainnetMarkets: Market[] = [
  {
    lendingToken: 'DAI',
    collateralTokens: ['ETH'],
  },
]

export const markets: Record<string, Market[]> = {
  kovan: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['ETH'],
    },
  ],
  rinkeby: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['ETH'],
    },
  ],
  ropsten: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['ETH'],
    },
  ],
  hardhat: mainnetMarkets,
  localhost: mainnetMarkets,
  mainnet: mainnetMarkets,
}
