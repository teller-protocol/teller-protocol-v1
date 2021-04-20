import { BigNumber, BigNumberish, Signer } from 'ethers'
import { contracts, ethers, fastForward, toBN, tokens } from 'hardhat'

import { ITellerDiamond } from '../../types/typechain'
import { ONE_DAY } from '../../utils/consts'
import { mockCRAResponse } from './mock-cra-response'

export enum LoanType {
  ZERO_COLLATERAL,
  UNDER_COLLATERALIZED,
  OVER_COLLATERALIZED,
}

export interface CreateLoanArgs {
  lendTokenSym: string
  collTokenSym: string
  borrower: Signer
  loanType: LoanType
  amount: BigNumber
}

export const createLoan = async (args: CreateLoanArgs): Promise<string> => {
  const { lendTokenSym, collTokenSym, borrower, loanType, amount } = args

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')

  const collToken = await tokens.get(collTokenSym)
  const lendingToken = await tokens.get(lendTokenSym)

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
    lendingToken: lendingToken.address,
    loanAmount: amount.toString(),
    loanTermLength: ONE_DAY.toString(),
    collateralRatio: collateralRatio.toString(),
    interestRate: '400',
    borrower: await borrower.getAddress(),
  })

  // Create loan with terms
  await diamond
    .connect(borrower)
    .createLoanWithTerms(
      craReturn.request,
      [craReturn.response],
      collToken.address,
      '0'
    )
  const borrowerAddress = await borrower.getAddress()

  // Return ID for created loan
  const allBorrowerLoans = await diamond.getBorrowerLoans(borrowerAddress)
  return allBorrowerLoans[allBorrowerLoans.length - 1].toString()
}

interface TakeOutLoanArgs {
  loanId: string | number
  amount?: BigNumberish
}

export const takeOutLoan = async (args: TakeOutLoanArgs): Promise<void> => {
  const { loanId, amount } = args

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  const loan = await diamond.getLoan(loanId)
  const borrowerSigner = await ethers.getSigner(loan.loanTerms.borrower)
  const loanAmount = amount ?? loan.loanTerms.maxLoanAmount

  // Deposit collateral
  const {
    neededInCollateralTokens: collateral,
  } = await diamond.getCollateralNeededInfo(loanId)
  await diamond
    .connect(borrowerSigner)
    .depositCollateral(loan.loanTerms.borrower, loanId, collateral, {
      value: collateral,
    })

  // Forward block timestamp
  await fastForward(300)

  // Take out loan as borrower
  await diamond
    .connect(borrowerSigner)
    .takeOutLoan(loanId, toBN(loanAmount, '18'))
}
