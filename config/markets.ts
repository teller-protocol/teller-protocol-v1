import { Market, MarketStrategy } from '../types/custom/config-types'

const parseCompoundWeth = (sym: string): string => {
  sym = sym.toUpperCase()
  switch (sym) {
    case 'WETH':
      return 'ETH'
    default:
      return sym
  }
}

const compoundStrategy = (tokenSym: string): MarketStrategy => ({
  name: 'TTokenCompoundStrategy_2',
  initArgs: [
    {
      type: 'TokenSymbol',
      value: `C${parseCompoundWeth(tokenSym)}`,
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
})

const aaveStrategy = (tokenSym: string): MarketStrategy => ({
  name: 'TTokenAaveStrategy_1',
  initArgs: [
    {
      type: 'TokenSymbol',
      value: `A${tokenSym}`,
    },
    {
      type: 'ProtocolAddressConstant',
      value: 'aaveLendingPoolAddressProvider',
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
})

const mapTokenMarkets = (
  networkTokens: string[],
  strategyFn: (...args: any[]) => MarketStrategy
): Market[] =>
  networkTokens.map((lendingToken, i, tokens) => {
    // Remove the `lendingToken` from the collateral token list
    const collateralTokens = tokens.concat()
    collateralTokens.splice(i, 1)
    return {
      lendingToken,
      collateralTokens,
      strategy: strategyFn(lendingToken),
    }
  })

const mainnetMarkets: Market[] = mapTokenMarkets(
  ['WETH', 'DAI', 'USDC', 'USDT', 'WBTC', 'LINK'],
  compoundStrategy
)

const polygonMarkets: Market[] = mapTokenMarkets(
  ['WETH', 'DAI', 'USDC', 'USDT', 'WBTC', 'WMATIC'],
  aaveStrategy
)

export const markets: Record<string, Market[]> = {
  kovan: mapTokenMarkets(['WETH', 'DAI', 'USDC', 'USDT'], compoundStrategy),
  rinkeby: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['WETH'],
      strategy: compoundStrategy('dai'),
    },
  ],
  ropsten: [
    {
      lendingToken: 'DAI',
      collateralTokens: ['WETH'],
      strategy: compoundStrategy('dai'),
    },
  ],
  hardhat: polygonMarkets,
  localhost: polygonMarkets,
  mainnet: mainnetMarkets,
  polygon: polygonMarkets,
  polygon_mumbai: polygonMarkets,
}
