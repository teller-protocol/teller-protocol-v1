import { deployments } from 'hardhat'
import { getMarkets } from '../../config/markets'
import { Network } from '../../types/custom/config-types'
import { LendingPool, Loans } from '../../types/typechain'
import { getMarket, GetMarketReturn } from '../../tasks'
import { getFunds } from '../../utils/get-funds'

interface DeployedMarketArgs {
  lendTokenSym: string
  collTokenSym: string
}

interface FundedMarketArgs {
  market?: DeployedMarketArgs
  amount?: number
}

interface FundedMarketReturn {
  loans: Loans
  lendingPool: LendingPool
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
    const lender = await getNamedSigner('lender')
    await getFunds({
      to: lender,
      tokenSym: lendTokenSym,
      amount: 10000
    })
    await lendingToken
      .connect(lender)
      .approve(market.lendingPool.address, 10000)
    await market.lendingPool
      .connect(lender)
      .deposit(10000)

    return market
  })()
