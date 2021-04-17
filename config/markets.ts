import { Market } from '../types/custom/config-types'
import { AssetType } from '../utils/consts'

const mainnetMarkets: Market[] = [
  {
    lendingToken: 'DAI',
    collateralTokens: ['WETH'],
    maxTVL: 100000,
  },
]

export const markets: Record<string, Market[]> = {
  kovan: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['WETH'],
      maxTVL: 100000,
    },
  ],
  rinkeby: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['WETH'],
      maxTVL: 100000,
    },
  ],
  ropsten: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['WETH'],
      maxTVL: 100000,
    },
  ],
  hardhat: mainnetMarkets,
  localhost: mainnetMarkets,
  mainnet: mainnetMarkets,
}
