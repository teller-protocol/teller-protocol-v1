import {
  BigNumber,
  BigNumberish,
  ContractTransaction,
  PayableOverrides,
  Signer,
} from 'ethers'
import { contracts, ethers, toBN, tokens } from 'hardhat'
import moment from 'moment'

import { ITellerDiamond } from '../../types/typechain'
import { mockCRAResponse } from './mock-cra-response'

export enum LoanType {
  ZERO_COLLATERAL,
  UNDER_COLLATERALIZED,
  OVER_COLLATERALIZED,
}

export interface LoanHelpersReturn {
  diamond: ITellerDiamond
  details: PromiseReturnType<typeof loanDetails>
  takeOut: (
    amount?: BigNumberish,
    from?: Signer
  ) => ReturnType<typeof takeOutLoan>
  repay: (amount: BigNumberish, from?: Signer) => ReturnType<typeof repayLoan>
  collateral: {
    needed: () => ReturnType<typeof collateralNeeded>
    current: () => ReturnType<typeof collateralCurrent>
    deposit: (
      amount: BigNumberish,
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

  return {
    diamond,
    details,
    takeOut: (amount = details.loan.loanTerms.maxLoanAmount, from?: Signer) =>
      takeOutLoan({ diamond, details, amount, from }),
    repay: (amount: BigNumberish, from?: Signer) =>
      repayLoan({ diamond, details, amount, from }),
    collateral: {
      needed: () => collateralNeeded({ diamond, details }),
      current: () => collateralCurrent({ diamond, details }),
      deposit: (amount: BigNumberish, from?: Signer) =>
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
  duration?: moment.Duration
}

export interface CreateLoanReturn {
  tx: Promise<ContractTransaction>
  getHelpers: () => Promise<LoanHelpersReturn>
}

export const createLoanArgs = async (
  args: CreateLoanArgs
): Promise<Parameters<ITellerDiamond['createLoanWithTerms']>> => {
  const {
    lendTokenSym,
    collTokenSym,
    borrower,
    loanType,
    amount: loanAmount,
    duration = moment.duration(1, 'day'),
  } = args

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
    loanAmount: toBN(loanAmount),
    loanTermLength: duration.asSeconds(),
    collateralRatio: collateralRatio,
    interestRate: '400',
    borrower,
  })

  return [craReturn.request, [craReturn.response], collToken.address, '0']
}

export const createLoan = async (
  args: CreateLoanArgs
): Promise<CreateLoanReturn> => {
  const { borrower } = args

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  const createArgs = await createLoanArgs(args)

  // Create loan with terms
  const tx = diamond
    .connect(ethers.provider.getSigner(borrower))
    .createLoanWithTerms(...createArgs)

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
  loan: PromiseReturnType<typeof ITellerDiamond.prototype.getLoan>
  totalOwed: BigNumber
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
  const totalOwed = loan.principalOwed.add(loan.interestOwed)
  const signer = await ethers.provider.getSigner(loan.loanTerms.borrower)

  return {
    loan,
    totalOwed,
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

  const weth = await tokens.get('WETH')
  const collateralToken = await tokens.get(details.loan.collateralToken)
  const options: PayableOverrides = {}
  if (details.loan.collateralToken == weth.address) {
    options.value = amount
  } else {
    await collateralToken.approve(diamond.address, amount)
  }

  return await diamond
    .connect(from)
    .depositCollateral(details.loan.id, amount, options)
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

interface CollateralCurrentArgs extends CommonLoanArgs {}

const collateralCurrent = async (
  args: CollateralCurrentArgs
): Promise<BigNumber> => {
  const { diamond, details } = args
  return await diamond.getLoanCollateral(details.loan.id)
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
