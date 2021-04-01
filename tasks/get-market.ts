import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import {
  ERC20Detailed,
  LendingPool,
  LoanData,
  LoanManager,
  MarketRegistry,
  TToken,
} from '../types/typechain'
import { getTokens } from '../config'

interface GetMarketArgs {
  lendTokenSym: string
  collTokenSym: string
  log?: boolean
}

export interface GetMarketReturn {
  lendingPool: LendingPool
  loanManager: LoanManager
  lendingToken: ERC20Detailed
  tToken: TToken
}

export const getMarket = async (
  args: GetMarketArgs,
  hre: HardhatRuntimeEnvironment
): Promise<GetMarketReturn> => {
  const { lendTokenSym, collTokenSym, log } = args

  const { contracts, tokens, network } = hre

  const {
    [lendTokenSym]: lendingTokenAddress,
    [collTokenSym]: collateralTokenAddress,
  } = getTokens(network)

  const marketRegistry = await contracts.get<MarketRegistry>('MarketRegistry')

  const lendingPoolAddress = await marketRegistry.lendingPools(
    lendingTokenAddress
  )
  const lendingPool = await contracts.get<LendingPool>('LendingPool', {
    at: lendingPoolAddress,
  })

  const loanManagerAddress = await marketRegistry.loanManagers(
    lendingTokenAddress,
    collateralTokenAddress
  )
  const loanManager = await contracts.get<LoanManager>('LoanManager', {
    at: loanManagerAddress,
  })

  const lendingToken = await tokens.get(lendTokenSym)
  const tToken = await contracts.get<TToken>('TToken', {
    at: await lendingPool.tToken(),
  })

  if (log) {
    console.log(`
  Market:                   ${lendTokenSym}/${collTokenSym}

  Lending Pool Address:     ${lendingPoolAddress}

  Loan Manager Address:     ${loanManagerAddress}
    `)
  }

  return {
    lendingPool,
    loanManager,
    lendingToken,
    tToken,
  }
}

task('get-market', 'Gets a deployed market')
  .addParam('lendTokenSym', 'The lending token symbol')
  .addParam('collTokenSym', 'The collateral token symbol')
  .addOptionalParam('log', 'Enable logs', true, types.boolean)
  .setAction(getMarket)
