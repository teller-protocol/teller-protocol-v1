import { deployments } from 'hardhat'
import { Signer } from 'ethers'
import { fundedMarket, FundedMarketArgs, FundedMarketReturn } from './markets'
import { mockCRAResponse } from '../../utils/mock-cra-response'
import { ONE_DAY } from '../../utils/consts'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

enum LoanType {
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
  extends FundedMarketReturn,
    BorrowedLoanReturn {}

export interface BorrowedLoanReturn {
  loanID: string
  totalOwed: number
}

export const marketWithLoan = (
  args: MarketWithLoanArgs
): Promise<MarketWithLoanReturn> =>
  deployments.createFixture(async (hre) => {
    const market = await fundedMarket(args.market)
    const createdLoan = await borrowLoan(
      market,
      args.borrower,
      args.loanType,
      hre
    )
    return {
      ...market,
      ...createdLoan,
    }
  })()

const borrowLoan = async (
  market: FundedMarketReturn,
  borrower: Signer,
  loanType: LoanType,
  hre: HardhatRuntimeEnvironment
): Promise<BorrowedLoanReturn> => {
  const { fastForward, ethers } = hre
  const BN = ethers.BigNumber
  const loanAmount = BN.from('1684')

  // Set up collateral
  let collateralRatio = 0

  switch (loanType) {
    case 0:
      break
    case 1:
      collateralRatio = 5000
      break
    case 2:
      collateralRatio = 15000
      break
  }

  // Get mock cra request and response
  const craReturn = await mockCRAResponse({
    lendingToken: market.lendTokenSym,
    collateralToken: market.collTokenSym,
    loanAmount: loanAmount.toString(),
    loanTermLength: ONE_DAY.toString(),
    collateralRatio: collateralRatio.toString(),
    interestRate: '400',
    borrower: await borrower.getAddress(),
  })

  // Create loan with terms
  await market.loans
    .connect(borrower)
    .createLoanWithTerms(craReturn.request, [craReturn.response], '0')
  const borrowerAddress = await borrower.getAddress()

  // Get loan ID
  const loanID = (
    await market.loans.getBorrowerLoans(borrowerAddress)
  ).toString()

  // Deposit collateral
  const collateral = (await market.loans.getCollateralInfo(loanID))
    .neededInCollateralTokens
  await market.loans
    .connect(borrower)
    .depositCollateral(borrowerAddress, loanID, collateral, {
      value: collateral,
    })

  // Forward block timestamp
  await fastForward(300)

  // Take out loan as borrower
  await market.loans.connect(borrower).takeOutLoan(loanID, loanAmount)

  // Get total owed for loan
  const totalOwed = Number(await market.loans.getTotalOwed(loanID))
  return {
    loanID,
    totalOwed,
  }
}
