import { BigNumber, BigNumberish, ContractTransaction, Signer } from 'ethers'
import { contracts, ethers, toBN, tokens } from 'hardhat'

import { IERC20, ITellerDiamond } from '../../types/typechain'
import { ONE_DAY } from '../../utils/consts'
import { mockCRAResponse } from './mock-cra-response'

type PromiseReturn<T> = T extends PromiseLike<infer U> ? U : T

export enum LoanType {
  ZERO_COLLATERAL,
  UNDER_COLLATERALIZED,
  OVER_COLLATERALIZED,
}

export interface LoanHelpersReturn {
  diamond: ITellerDiamond
  details: PromiseReturn<ReturnType<typeof loanDetails>>
  takeOut: (
    amount?: BigNumberish,
    from?: Signer
  ) => ReturnType<typeof takeOutLoan>
  repay: (amount: BigNumberish, from?: Signer) => ReturnType<typeof repayLoan>
  collateral: {
    needed: PromiseReturn<ReturnType<typeof collateralNeeded>>
    deposit: (
      amount?: BigNumberish,
      from?: Signer
    ) => ReturnType<typeof depositCollateral>
    withdraw: (
      amount: BigNumberish,
      from?: Signer
    ) => ReturnType<typeof withdrawCollateral>
  }
}

export const loanHelpers = async (
  loanID: string
): Promise<LoanHelpersReturn> => {
  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  const details = await loanDetails(loanID)
  const collNeeded = await collateralNeeded({ diamond, details })
  return {
    diamond,
    details,
    takeOut: (amount = details.loan.loanTerms.maxLoanAmount, from?: Signer) =>
      takeOutLoan({ diamond, details, amount, from }),
    repay: (amount: BigNumberish, from?: Signer) =>
      repayLoan({ diamond, details, amount, from }),
    collateral: {
      needed: collNeeded,
      deposit: (amount = collNeeded, from?: Signer) =>
        depositCollateral({ diamond, details, amount, from }),
      withdraw: (amount: BigNumberish, from?: Signer) =>
        withdrawCollateral({ diamond, details, amount, from }),
    },
  }
}

interface CreateLoanArgs {
  lendTokenSym: string
  collTokenSym: string
  borrower: string
  loanType: LoanType
  amount: BigNumberish
}

export interface CreateLoanReturn {
  tx: Promise<ContractTransaction>
  getHelpers: () => Promise<LoanHelpersReturn>
}

export const createLoan = async (
  args: CreateLoanArgs
): Promise<CreateLoanReturn> => {
  const {
    lendTokenSym,
    collTokenSym,
    borrower,
    loanType,
    amount: loanAmount,
  } = args

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
    loanAmount: toBN(loanAmount).toString(),
    loanTermLength: ONE_DAY.toString(),
    collateralRatio: collateralRatio.toString(),
    interestRate: '400',
    borrower,
  })

  // Create loan with terms
  const tx = diamond
    .connect(ethers.provider.getSigner(borrower))
    .createLoanWithTerms(
      craReturn.request,
      [craReturn.response],
      collToken.address,
      '0'
    )

  return {
    tx,
    getHelpers: async (): Promise<LoanHelpersReturn> => {
      const allBorrowerLoans = await diamond.getBorrowerLoans(borrower)
      const loanID = allBorrowerLoans[allBorrowerLoans.length - 1].toString()
      return await loanHelpers(loanID)
    },
  }
}

interface LoanDetailsReturn {
  loan: PromiseReturn<ReturnType<typeof ITellerDiamond.prototype.getLoan>>
  borrower: {
    address: string
    signer: Signer
  }
  refresh: () => ReturnType<typeof loanDetails>
}

const loanDetails = async (
  loanID: BigNumberish
): Promise<LoanDetailsReturn> => {
  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  const loan = await diamond.getLoan(loanID)
  const signer = await ethers.provider.getSigner(loan.loanTerms.borrower)

  return {
    loan,
    borrower: { address: loan.loanTerms.borrower, signer },
    refresh: () => loanDetails(loanID),
  }
}

interface CommonLoanArgs {
  diamond: ITellerDiamond
  details: LoanDetailsReturn
  from?: Signer
}

interface TakeOutLoanArgs extends CommonLoanArgs {
  amount?: BigNumberish
}

const takeOutLoan = async (
  args: TakeOutLoanArgs
): Promise<ContractTransaction> => {
  const {
    diamond,
    details,
    amount = details.loan.loanTerms.maxLoanAmount,
    from = details.borrower.signer,
  } = args

  return await diamond.connect(from).takeOutLoan(details.loan.id, amount)
}

interface DepositCollateralArgs extends CommonLoanArgs {
  amount?: BigNumberish
}

const depositCollateral = async (
  args: DepositCollateralArgs
): Promise<ContractTransaction> => {
  const {
    diamond,
    details,
    amount = await collateralNeeded({ diamond, details }),
    from = details.borrower.signer,
  } = args

  const eth = await tokens.get('WETH')
  const collateralToken = await contracts.get<IERC20>('IERC20', {
    at: details.loan.collateralToken,
  })
  if (details.loan.collateralToken == eth.address) {
    return await diamond
      .connect(from)
      .depositCollateral(details.borrower.address, details.loan.id, amount, {
        value: amount, // Only if collateral is ETH
      })
  } else {
    await collateralToken.approve(diamond.address, amount)
    return await diamond
      .connect(from)
      .depositCollateral(details.borrower.address, details.loan.id, amount)
  }
}

interface WithdrawCollateralArgs extends CommonLoanArgs {
  amount: BigNumberish
}

const withdrawCollateral = async (
  args: WithdrawCollateralArgs
): Promise<ContractTransaction> => {
  const { diamond, details, amount, from = details.borrower.signer } = args

  return await diamond.connect(from).withdrawCollateral(amount, details.loan.id)
}

interface CollateralNeededArgs extends CommonLoanArgs {}

const collateralNeeded = async (
  args: CollateralNeededArgs
): Promise<BigNumber> => {
  const { diamond, details } = args
  const { neededInCollateralTokens } = await diamond.getCollateralNeededInfo(
    details.loan.id
  )
  return neededInCollateralTokens
}

interface RepayLoanArgs extends CommonLoanArgs {
  amount: BigNumberish
}

const repayLoan = async (args: RepayLoanArgs): Promise<ContractTransaction> => {
  const {
    diamond,
    details: { loan, borrower },
    amount,
    from = borrower.signer,
  } = args

  return await diamond.connect(from).repay(amount, loan.id)
}
