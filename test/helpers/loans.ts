import {
  BigNumber,
  BigNumberish,
  ContractTransaction,
  PayableOverrides,
  Signer,
} from 'ethers'
import hre from 'hardhat'
import moment from 'moment'

import { getNFT } from '../../config'
import { claimNFT, getLoanMerkleTree, setLoanMerkle } from '../../tasks'
import { ERC20, ITellerDiamond, TellerNFT } from '../../types/typechain'
import { LoanStatus } from '../../utils/consts'
import { getFunds } from './get-funds'
import { mockCRAResponse } from './mock-cra-response'

const { getNamedAccounts, contracts, tokens, ethers, toBN, evm } = hre

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
    from?: Signer,
    nft?: boolean
  ) => ReturnType<typeof takeOutLoan>
  repay: (amount: BigNumberish, from?: Signer) => ReturnType<typeof repayLoan>
  escrowRepay: (
    amount: BigNumberish,
    from?: Signer
  ) => ReturnType<typeof escrowRepayLoan>
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
    takeOut: (
      amount = details.terms.maxLoanAmount,
      from?: Signer,
      nft?: boolean
    ) => takeOutLoan({ diamond, details, amount, from, nft }),
    repay: (amount: BigNumberish, from?: Signer) =>
      repayLoan({ diamond, details, amount, from }),
    escrowRepay: (amount: BigNumberish, from?: Signer) =>
      escrowRepayLoan({ diamond, details, amount, from }),
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
  lendToken: string | ERC20
  collToken: string | ERC20
  loanType: LoanType
  amount?: BigNumberish
  amountBN?: BigNumberish
  borrower?: string
  duration?: moment.Duration
  nft?: boolean
}

export interface CreateLoanReturn {
  tx: Promise<ContractTransaction>
  getHelpers: () => Promise<LoanHelpersReturn>
}

export const createLoan = async (
  args: CreateLoanArgs
): Promise<CreateLoanReturn> => {
  const {
    lendToken,
    collToken,
    loanType,
    amount = 100,
    amountBN,
    duration = moment.duration(1, 'day'),
  } = args

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  const lendingToken =
    typeof lendToken === 'string' ? await tokens.get(lendToken) : lendToken
  const collateralToken =
    typeof collToken === 'string' ? await tokens.get(collToken) : collToken

  const borrower = args.borrower ?? (await getNamedAccounts()).borrower
  const loanAmount = amountBN ?? toBN(amount, await lendingToken.decimals())

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
    loanAmount,
    loanTermLength: duration.asSeconds(),
    collateralRatio: collateralRatio,
    interestRate: '400',
    borrower,
  })

  // Create loan with terms
  const tx = diamond
    .connect(ethers.provider.getSigner(borrower))
    .createLoanWithTerms(
      craReturn.request,
      [craReturn.response],
      collateralToken.address,
      '0'
    )

  return {
    tx,
    getHelpers: async (): Promise<LoanHelpersReturn> => {
      await tx
      const allBorrowerLoans = await diamond.getBorrowerLoans(borrower)
      const loanID = allBorrowerLoans[allBorrowerLoans.length - 1].toString()
      return await loanHelpers(loanID)
    },
  }
}

export const takeOut = async (
  args: CreateLoanArgs
): Promise<LoanHelpersReturn> => {
  // Setup for NFT user
  const { merkleTrees } = getNFT(hre.network)
  const borrower = ethers.utils.getAddress(merkleTrees[0].balances[0].address)
  if (args.nft) {
    args.borrower = borrower
    await evm.impersonate(borrower)
    const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
    await diamond.addAuthorizedAddress(borrower)
    await getFunds({
      to: borrower,
      amount: ethers.utils.parseEther('1'),
      tokenSym: 'ETH',
      hre,
    })
  }

  // Create loan
  const { getHelpers } = await createLoan(args)
  const helpers = await getHelpers()
  const { diamond, collateral, details, takeOut } = helpers

  // Deposit collateral needed
  const neededCollateral = await collateral.needed()
  if (neededCollateral.gt(0)) {
    await collateral.deposit(neededCollateral)
    // .should.emit(diamond, 'CollateralDeposited')
    // .withArgs(loanID, borrowerAddress, collateralNeeded)
  }

  // Advance time
  await evm.advanceTime(moment.duration(5, 'minutes'))

  // Take out loan
  await takeOut(details.terms.maxLoanAmount, details.borrower.signer, args.nft)
    .should.emit(diamond, 'LoanTakenOut')
    .withArgs(
      details.loan.id,
      details.borrower.address,
      details.terms.maxLoanAmount,
      args.nft
    )

  // Refresh details after taking out loan
  helpers.details = await details.refresh()
  // Verify loan is now active
  helpers.details.loan.status.should.eq(LoanStatus.Active)

  return helpers
}

interface LoanDetailsReturn {
  lendingToken: ERC20
  collateralToken: ERC20
  loan: PromiseReturnType<typeof ITellerDiamond.prototype.getLoan>
  debt: PromiseReturnType<typeof ITellerDiamond.prototype.getDebtOwed>
  terms: PromiseReturnType<typeof ITellerDiamond.prototype.getLoanTerms>
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
  const lendingToken = await tokens.get(loan.lendingToken)
  const collateralToken = await tokens.get(loan.collateralToken)
  const debt = await diamond.getDebtOwed(loan.id)
  const totalOwed = debt.principalOwed.add(debt.interestOwed)
  const terms = await diamond.getLoanTerms(loan.id)
  const signer = await ethers.provider.getSigner(loan.borrower)

  return {
    loan,
    lendingToken,
    collateralToken,
    debt,
    totalOwed,
    terms,
    borrower: { address: loan.borrower, signer },
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
  nft?: boolean
}

const takeOutLoan = async (
  args: TakeOutLoanArgs
): Promise<ContractTransaction> => {
  const {
    diamond,
    details,
    amount = details.terms.maxLoanAmount,
    from = details.borrower.signer,
    nft,
  } = args

  if (!nft) {
    return await diamond.connect(from).takeOutLoan(details.loan.id, amount)
  } else {
    const borrower = await from.getAddress()
    const deployer = await ethers.provider.getSigner(0)
    await diamond.connect(deployer).addAuthorizedAddress(borrower)

    // Claim user's NFTs
    await claimNFT({ account: borrower, merkleIndex: 0 }, hre)

    // Create and set NFT loan merkle
    const nftLoanTree = await getLoanMerkleTree(hre)
    await setLoanMerkle({ loanTree: nftLoanTree }, hre)
    const proofs = []

    // Get the sum of loan amount to take out
    const nft = await contracts.get<TellerNFT>('TellerNFT')
    const ownedNFTs = await nft
      .getOwnedTokens(borrower)
      .then((arr) => (arr.length > 2 ? arr.slice(0, 2) : arr))
    const lendingToken = await tokens.get(details.lendingToken.address)
    let maxNftAmount = toBN(0)
    for (const nftID of ownedNFTs) {
      const { tier_ } = await nft.getTokenTier(nftID)
      const baseLoanSize = toBN(
        tier_.baseLoanSize,
        await lendingToken.decimals()
      )
      maxNftAmount = maxNftAmount.add(baseLoanSize)

      // Get the proofs for the NFT loan size
      proofs.push({
        id: nftID,
        baseLoanSize,
        proof: nftLoanTree.getProof(nftID, baseLoanSize),
      })
    }

    // Set NFT approval
    await nft.connect(from).setApprovalForAll(diamond.address, true)

    // Stake user NFTs
    await diamond.connect(from).stakeNFTs(ownedNFTs)

    const amountBN = ethers.BigNumber.from(amount)
    if (amountBN.gt(maxNftAmount)) {
      throw new Error(`Invalid loan amount (max: ${maxNftAmount.toString()})`)
    }

    return await diamond
      .connect(from)
      .takeOutLoanWithNFTs(details.loan.id, amount, proofs)
  }
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
  if (
    ethers.utils.getAddress(details.loan.collateralToken) ==
    ethers.utils.getAddress(weth.address)
  ) {
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

  return await diamond.connect(from).repayLoan(loan.id, amount)
}

const escrowRepayLoan = async (
  args: RepayLoanArgs
): Promise<ContractTransaction> => {
  const {
    diamond,
    details: { loan, borrower },
    amount,
    from = borrower.signer,
  } = args

  return await diamond.connect(from).escrowRepay(loan.id, amount)
}
