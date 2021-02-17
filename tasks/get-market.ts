import { task, types } from 'hardhat/config'
import { LendingPool, Loans, MarketRegistry } from '../types/typechain'
import { getTokens } from '../config/tokens'
import { Network } from '../types/custom/config-types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

interface GetMarketArgs {
  lendTokenSym: string
  collTokenSym: string
  log?: boolean
}

interface GetMarketReturn {
  lendingPool: LendingPool
  loans: Loans
}

export const getMarket = async (args: GetMarketArgs, hre: HardhatRuntimeEnvironment): Promise<GetMarketReturn> => {
  const { lendTokenSym, collTokenSym, log } = args

  const { contracts, network } = hre

  const { [lendTokenSym]: lendingTokenAddress, [collTokenSym]: collateralTokenAddress } = getTokens(<Network>network.name)

  const marketRegistry = await contracts.get<MarketRegistry>('MarketRegistry')

  const lendingPoolAddress = await marketRegistry.lendingPools(lendingTokenAddress)
  const lendingPool = await contracts.get<LendingPool>('LendingPool', { at: lendingPoolAddress })

  const loansAddress = await marketRegistry.loans(lendingTokenAddress, collateralTokenAddress)
  const loans = await contracts.get<Loans>('Loans', { at: loansAddress })

  if (log) {
    console.log(`
  Market:                   ${lendTokenSym}/${collTokenSym}

  Lending Pool Address:     ${lendingPoolAddress}

  Loans Address:            ${loansAddress}
    `)
  }

  return {
    lendingPool,
    loans,
  }
}

task('get-market', 'Gets a deployed market')
  .addParam('lendTokenSym', 'The lending token symbol')
  .addParam('collTokenSym', 'The collateral token symbol')
  .addOptionalParam('log', 'Enable logs', true, types.boolean)
  .setAction(getMarket)
