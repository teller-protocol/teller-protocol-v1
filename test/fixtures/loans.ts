import { deployments, contracts, toBN } from 'hardhat'
import { BigNumber, Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { fundedMarket, FundedMarketArgs, MarketReturn } from './markets'
import { mockCRAResponse } from '../helpers/mock-cra-response'
import { ONE_DAY } from '../../utils/consts'
import { LoanManager } from '../../types/typechain'

export enum LoanType {
  ZERO_COLLATERAL,
  UNDER_COLLATERALIZED,
  OVER_COLLATERALIZED,
}

export interface MarketWithLoanArgs {
  market?: FundedMarketArgs
  borrower: Signer
  loanType: LoanType
}

export interface MarketWithLoanReturn
  extends MarketReturn,
    BorrowedLoanReturn {}

export interface BorrowedLoanReturn {
  createdLoanId: string
  totalOwed: BigNumber
}

export const createMarketWithLoan = (
  args: MarketWithLoanArgs
): Promise<MarketWithLoanReturn> =>
  deployments.createFixture(async (hre) => {
    // Create a fully funded market
    const market = await fundedMarket(args.market)

    // Create a loan with terms, deposit collateral and take it out from the funded market
    const createdLoan = await createAndGetLoan(
      market,
      args.borrower,
      args.loanType,
      hre
    )

    // Return the market state with the created loan ID and total owed
    return {
      ...market,
      ...createdLoan,
    }
  })()

export const createAndGetLoan = async (
  market: MarketReturn,
  borrower: Signer,
  loanType: LoanType,
  hre: HardhatRuntimeEnvironment
): Promise<BorrowedLoanReturn> => {
  // Setup loan amount
  const loanAmount = '1684'

  // Create a loan and get the loan ID
  const createdLoanId = await createLoan(market, loanType, loanAmount, borrower)
  // Take out loan
  await getLoan(market.loanManager, createdLoanId, loanAmount, borrower, hre)
  // Get total owed for loan
  const totalOwed = await market.loanManager.getTotalOwed(createdLoanId)

  return {
    createdLoanId,
    totalOwed,
  }
}

export const createLoan = async (
  market: MarketReturn,
  loanType: LoanType,
  loanAmount: string,
  borrower: Signer
): Promise<string> => {
  // Get lending asset decimals and convert amount to BN
  const lendingToken = await contracts.get('ERC20Detailed', {
    at: await market.lendingPool.lendingToken(),
  })
  const amount = toBN(loanAmount, await lendingToken.decimals()).toString()
  // Set up collateral
  let collateralRatio = 0
  switch (loanType) {
    case LoanType.ZERO_COLLATERAL:
      break
    case LoanType.UNDER_COLLATERALIZED:
      collateralRatio = 5000
      break
    case LoanType.OVER_COLLATERALIZED:
      collateralRatio = 15000
      break
  }

  // Get mock cra request and response
  const craReturn = await mockCRAResponse({
    lendingToken: market.lendTokenSym,
    collateralToken: market.collTokenSym,
    loanAmount: amount,
    loanTermLength: ONE_DAY.toString(),
    collateralRatio: collateralRatio.toString(),
    interestRate: '400',
    borrower: await borrower.getAddress(),
  })

  // Create loan with terms
  await market.loanManager
    .connect(borrower)
    .createLoanWithTerms(craReturn.request, [craReturn.response], '0')
  const borrowerAddress = await borrower.getAddress()

  // Return ID for created loan
  const allBorrowerLoans = await market.loanManager.getBorrowerLoans(
    borrowerAddress
  )
  return allBorrowerLoans[allBorrowerLoans.length - 1].toString()
}

export const getLoan = async (
  loanManager: LoanManager,
  createdLoanId: string,
  loanAmount: string,
  borrower: Signer,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { fastForward, toBN } = hre

  // Deposit collateral
  const [_, collateral] = await loanManager.getCollateralNeededInfo(
    createdLoanId
  )
  const borrowerAddress = await borrower.getAddress()
  await loanManager
    .connect(borrower)
    .depositCollateral(borrowerAddress, createdLoanId, collateral, {
      value: collateral,
    })

  // Forward block timestamp
  await fastForward(300)

  // Take out loan as borrower
  await loanManager
    .connect(borrower)
    .takeOutLoan(createdLoanId, toBN(loanAmount, '18'))
}
