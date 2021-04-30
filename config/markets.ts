import { Market } from '../types/custom/config-types'

const mainnetMarkets: Market[] = [
  {
    lendingToken: 'DAI',
    collateralTokens: ['WETH'],
    strategy: {
      name: 'TTokenCompoundStrategy_1',
      initArgs: [
        {
          type: 'TokenSymbol',
          value: 'CDAI',
        },
        {
          // Balance Ratio Min
          type: 'Number',
          value: '2000',
        },
        {
          // Balance Ratio Max
          type: 'Number',
          value: '4000',
        },
      ],
    },
  },
]

export const markets: Record<string, Market[]> = {
  kovan: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['WETH'],
      strategy: {
        name: 'TTokenCompoundStrategy_1',
        initArgs: [
          {
            type: 'TokenSymbol',
            value: 'CDAI',
          },
          {
            // Balance Ratio Min
            type: 'Number',
            value: '2000',
          },
          {
            // Balance Ratio Max
            type: 'Number',
            value: '4000',
          },
        ],
      },
    },
  ],
  rinkeby: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['WETH'],
      strategy: {
        name: 'TTokenCompoundStrategy_1',
        initArgs: [
          {
            type: 'TokenSymbol',
            value: 'CDAI',
          },
          {
            // Balance Ratio Min
            type: 'Number',
            value: '2000',
          },
          {
            // Balance Ratio Max
            type: 'Number',
            value: '4000',
          },
        ],
      },
    },
  ],
  ropsten: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['WETH'],
      strategy: {
        name: 'TTokenCompoundStrategy_1',
        initArgs: [
          {
            type: 'TokenSymbol',
            value: 'CDAI',
          },
          {
            // Balance Ratio Min
            type: 'Number',
            value: '2000',
          },
          {
            // Balance Ratio Max
            type: 'Number',
            value: '4000',
          },
        ],
      },
    },
  ],
  hardhat: mainnetMarkets,
  localhost: mainnetMarkets,
  mainnet: mainnetMarkets,
}
