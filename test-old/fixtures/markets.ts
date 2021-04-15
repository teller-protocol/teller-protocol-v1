import {
  deployments,
  contracts,
  tokens,
  network,
  getNamedSigner,
  toBN,
} from 'hardhat'
import { BigNumberish } from 'ethers'

import { AssetSettings, ERC20, TToken } from '../../types/typechain'
import { getMarket, GetMarketReturn } from '../../tasks'
import { getFunds } from '../helpers/get-funds'
import { getMarkets } from '../../config'

interface FreshMarketArgs {
  lendTokenSym: string
  collTokenSym: string
}

export interface MarketReturn extends FreshMarketArgs, GetMarketReturn {
  lendingToken: ERC20
  tToken: TToken
}

export const freshMarket = (args?: FreshMarketArgs): Promise<MarketReturn> =>
  deployments.createFixture(async (hre) => {
    await deployments.fixture('markets')

    let lendTokenSym: string
    let collTokenSym: string
    if (args) {
      lendTokenSym = args.lendTokenSym
      collTokenSym = args.collTokenSym
    } else {
      const markets = await getMarkets(network)
      lendTokenSym = markets[0].lendingToken
      collTokenSym = markets[0].collateralToken
    }

    const market = await getMarket(
      {
        lendTokenSym,
        collTokenSym,
      },
      hre
    )

    return {
      ...market,
      lendTokenSym,
      collTokenSym,
    }
  })()

export interface FundedMarketArgs {
  market?: FreshMarketArgs
  // Amount should be denoted in decimal value for the token (i.e. 100 = 100 * (10^tokenDecimals)
  amount?: number
}

export const fundedMarket = (args?: FundedMarketArgs): Promise<MarketReturn> =>
  deployments.createFixture(async (hre) => {
    const market = await freshMarket(args?.market)
    const { lendTokenSym, collTokenSym, lendingPool } = market

    const lendingToken = await tokens.get(lendTokenSym)

    // Fund the market
    let amountToFundLP: BigNumberish
    if (args?.amount) {
      const decimals = await lendingToken.decimals()
      amountToFundLP = toBN(args.amount, decimals)
    } else {
      const assetSettings = await contracts.get<AssetSettings>('AssetSettings')
      amountToFundLP = await assetSettings.getMaxTVLAmount(lendingToken.address)
    }

    const funder = await getNamedSigner('funder')
    await getFunds({
      to: funder,
      tokenSym: lendTokenSym,
      amount: amountToFundLP,
    })
    await lendingToken
      .connect(funder)
      .approve(lendingPool.address, amountToFundLP)
    await lendingPool.connect(funder).deposit(amountToFundLP)

    return {
      ...market,
      lendTokenSym,
      collTokenSym,
    }
  })()
