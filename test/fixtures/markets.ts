import { deployments } from 'hardhat'
import { getMarkets } from '../../config/markets'
import { Network } from '../../types/custom/config-types'
import { AssetSettings } from '../../types/typechain'
import { getMarket, GetMarketReturn } from '../../tasks'
import { getFunds } from '../../utils/get-funds'
import { BigNumberish } from 'ethers'

interface DeployedMarketArgs {
  lendTokenSym: string
  collTokenSym: string
}

interface FundedMarketArgs {
  market?: DeployedMarketArgs
  // Amount should be denoted in decimal value for the token (i.e. 100 = 100 * (10^tokenDecimals)
  amount?: number
}

export interface FundedMarketReturn extends GetMarketReturn {
  lendTokenSym: string
  collTokenSym: string
}

export const fundedMarket = (args?: FundedMarketArgs): Promise<FundedMarketReturn> =>
  deployments.createFixture(async (hre) => {
    const { deployments, network, getNamedSigner, contracts, tokens, ethers } = hre
    await deployments.fixture('markets')

    let lendTokenSym: string
    let collTokenSym: string
    if (args?.market) {
      lendTokenSym = args.market.lendTokenSym
      collTokenSym = args.market.collTokenSym
    } else {
      const markets = await getMarkets(<Network>network.name)
      lendTokenSym = markets[0].borrowedToken
      collTokenSym = markets[0].collateralToken
    }
    const lendingToken = await tokens.get(lendTokenSym)

    const market = await getMarket(
      {
        lendTokenSym,
        collTokenSym,
      },
      hre
    )

    // Fund the market
    let amountToFundLP: BigNumberish
    if (args?.amount) {
      const decimals = await lendingToken.decimals()
      const factor = ethers.BigNumber.from(10).pow(decimals)
      amountToFundLP = ethers.BigNumber.from(args.amount).mul(factor)
    } else {
      const assetSettings = await contracts.get<AssetSettings>('AssetSettings')
      amountToFundLP = await assetSettings.getMaxTVLAmount(lendingToken.address)
    }

    const lender = await getNamedSigner('lender')
    await getFunds({
      to: lender,
      tokenSym: lendTokenSym,
      amount: amountToFundLP,
    })
    await lendingToken.connect(lender).approve(market.lendingPool.address, amountToFundLP)
    await market.lendingPool.connect(lender).deposit(amountToFundLP)

    return {
      ...market,
      lendTokenSym,
      collTokenSym,
    }
  })()
