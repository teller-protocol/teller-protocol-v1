// external packages
import { isBytesLike } from '@ethersproject/bytes'
import { toUtf8Bytes } from '@ethersproject/strings'
import { time, timeStamp } from 'console'
import {
  BigNumber,
  BigNumberish,
  ContractTransaction,
  PayableOverrides,
  Signer,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import moment from 'moment'
import { ConsoleLogger } from 'ts-generator/dist/logger'
import {
  initialize,
  ZoKratesProvider,
  CompilationArtifacts,
  ComputationResult,
  Proof,
  SetupKeypair,
  // @ts-ignore
} from 'zokrates-js/node'
var uint32 = require('uint32')

// teller files
import { getNFT } from '../../config'
import { claimNFT, getLoanMerkleTree, setLoanMerkle } from '../../tasks'
import { ERC20, ITellerDiamond, TellerNFT } from '../../types/typechain'
import { getFunds } from './get-funds'
import { mockCRAResponse } from './mock-cra-response'
const {
  getNamedSigner,
  getNamedAccounts,
  contracts,
  tokens,
  ethers,
  toBN,
  evm,
} = hre
export enum LoanType {
  ZERO_COLLATERAL,
  UNDER_COLLATERALIZED,
  OVER_COLLATERALIZED,
}
export interface LoanHelpersReturn {
  diamond: ITellerDiamond
  details: PromiseReturnType<typeof loanDetails>
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
  hre: HardhatRuntimeEnvironment,
  loanID: string
): Promise<LoanHelpersReturn> => {
  const { contracts } = hre
  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  const details = await loanDetails(hre, loanID)
  return {
    diamond,
    details,
    repay: (amount: BigNumberish, from?: Signer) =>
      repayLoan({ diamond, details, amount, from }),
    escrowRepay: (amount: BigNumberish, from?: Signer) =>
      escrowRepayLoan({ diamond, details, amount, from }),
    collateral: {
      needed: () => collateralNeeded({ diamond, details }),
      current: () => collateralCurrent({ diamond, details }),
      deposit: (amount: BigNumberish, from?: Signer) =>
        depositCollateral(hre, { diamond, details, amount, from }),
      withdraw: (amount: BigNumberish, from?: Signer) =>
        withdrawCollateral({ diamond, details, amount, from }),
    },
  }
}

interface CreateLoanWithNftArgs {
  lendToken: string | ERC20
  borrower?: string
  deployer?: string
  amount?: BigNumberish
  amountBN?: BigNumberish
  duration?: moment.Duration
}
export interface CreateLoanArgs {
  lendToken: string | ERC20
  collToken: string | ERC20
  loanType: LoanType
  amount?: BigNumberish
  amountBN?: BigNumberish
  borrower?: string
  duration?: moment.Duration
  nft?: boolean
}

interface CreateLoanWithZKCRA {
  proof: typeof Proof
  computation: typeof ComputationResult
}

interface ZKCRAHelpersReturn {
  computation: typeof ComputationResult
  proof: typeof Proof
}
export interface CreateLoanReturn {
  tx: Promise<ContractTransaction>
  getHelpers: () => Promise<LoanHelpersReturn>
}
export const createLoan = async (
  hre: HardhatRuntimeEnvironment,
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
  const { contracts, tokens, getNamedAccounts, toBN } = hre
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
  const craReturn = await mockCRAResponse(hre, {
    lendingToken: lendingToken.address,
    loanAmount,
    loanTermLength: duration.asSeconds(),
    collateralRatio: collateralRatio,
    interestRate: '400',
    borrower,
  })
  // Create loan with terms
  const tx = diamond
    .connect(hre.ethers.provider.getSigner(borrower))
    .createLoanWithTerms(
      craReturn.request,
      [craReturn.responses],
      collateralToken.address,
      '0'
    )
  return {
    tx,
    getHelpers: async (): Promise<LoanHelpersReturn> => {
      await tx
      const allBorrowerLoans = await diamond.getBorrowerLoans(borrower)
      const loanID = allBorrowerLoans[allBorrowerLoans.length - 1].toString()
      return await loanHelpers(hre, loanID)
    },
  }
}

/**
 * @description: function helper that sets the collateral token and ratio and creates a mock CRA
 * response to plug into the newly merged create loan function that:
 *  - sets the terms
 *  - deposits collateral
 *  - takes out the loan
 *
 * @param args: CreateLoanArgs parameters to create the loan
 * @returns: Promise<CreateLoanReturn> helper variables to help run our tests
 */
export const takeOutLoanWithoutNfts = async (
  hre: HardhatRuntimeEnvironment,
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
  const { contracts, tokens, getNamedAccounts, toBN } = hre
  // define diamond contract
  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')

  // lending token
  const lendingToken =
    typeof lendToken === 'string' ? await tokens.get(lendToken) : lendToken

  // collateral token
  const collateralToken =
    typeof collToken === 'string' ? await tokens.get(collToken) : collToken
  const collateralIsNative =
    collateralToken.address === getNativeToken(hre.network)

  // set borrower and loan amount
  const borrower = args.borrower ?? (await getNamedAccounts()).borrower
  const loanAmount = amountBN ?? toBN(amount, await lendingToken.decimals())

  // depending on the loan type, we set a different collateral ratio. 10000 = 100%
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

  // create our mock CRA response
  const craReturn = await mockCRAResponse(hre, {
    lendingToken: lendingToken.address,
    loanAmount,
    loanTermLength: duration.asSeconds(),
    collateralRatio: collateralRatio,
    interestRate: '400',
    borrower,
  })

  const { value: collValue } = await getPrice(
    {
      src: await lendingToken.symbol(),
      dst: await collateralToken.symbol(),
      amount: hre.fromBN(loanAmount, await lendingToken.decimals()),
    },
    hre
  )
  const collAmount = hre.toBN(collValue, await collateralToken.decimals())
  const nativeAmount = collateralIsNative ? collAmount : BigNumber.from(0)
  if (!collateralIsNative) {
    await getFunds({
      tokenSym: await collateralToken.symbol(),
      amount: collAmount,
      to: borrower,
      hre,
    })
    await collateralToken
      .connect(hre.ethers.provider.getSigner(borrower))
      .approve(diamond.address, collAmount)
  }

  // call the takeOutLoan function from the diamond
  const tx = diamond
    .connect(hre.ethers.provider.getSigner(borrower))
    .takeOutLoan(
      { request: craReturn.request, responses: craReturn.responses },
      collateralToken.address,
      collAmount,
      { value: nativeAmount.toString() }
    )

  // return our transaction and our helper variable
  return {
    tx,
    getHelpers: async (): Promise<LoanHelpersReturn> => {
      await tx
      const allBorrowerLoans = await diamond.getBorrowerLoans(borrower)
      const loanID = allBorrowerLoans[allBorrowerLoans.length - 1].toString()
      return await loanHelpers(hre, loanID)
    },
  }
}

/**
 * @description: It creates, signs, apply with NFTs and takes out a loan in one function
 * @param args: Arguments we specify to create our Loan by depositing NFT
 * @returns Promise<CreateLoanReturn> that gives us data to help run our tests
 */
export const takeOutLoanWithNfts = async (
  hre: HardhatRuntimeEnvironment,
  args: CreateLoanWithNftArgs
): Promise<CreateLoanReturn> => {
  const { contracts, tokens, toBN, getNamedSigner } = hre
  const { lendToken, amount = 100, duration = moment.duration(1, 'day') } = args

  // diamond contract
  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')

  // lending token
  const lendingToken =
    typeof lendToken === 'string' ? await tokens.get(lendToken) : lendToken

  // amount in loan
  const loanAmount = toBN(amount, await lendingToken.decimals())

  // get the borrower, deployer and borrower's signer
  // const deployer = await getNamedSigner('deployer')
  const borrower = '0x86a41524cb61edd8b115a72ad9735f8068996688'
  const { signer: borrowerSigner } = await hre.evm.impersonate(borrower)

  // Claim user's NFT as borrower
  await claimNFT({ account: borrower, merkleIndex: 0 }, hre)

  // Get the sum of loan amount to take out
  const nft = await contracts.get<TellerNFT>('TellerNFT')

  // get all the borrower's NFTs
  const ownedNFTs = await nft
    .getOwnedTokens(borrower)
    .then((arr) => (arr.length > 2 ? arr.slice(0, 2) : arr))

  // Set NFT approval
  await nft.connect(borrowerSigner).setApprovalForAll(diamond.address, true)

  // Stake NFTs by transferring from the msg.sender (borrower) to the diamond
  await diamond.connect(borrowerSigner).stakeNFTs(ownedNFTs)

  // Create mockCRAResponse
  const craReturn = await mockCRAResponse(hre, {
    lendingToken: lendingToken.address,
    loanAmount,
    loanTermLength: duration.asSeconds(),
    collateralRatio: 0,
    interestRate: '400',
    borrower,
  })

  // plug it in the takeOutLoanWithNfts function along with the proofs to apply to the loan!
  const tx = diamond
    .connect(borrowerSigner)
    .takeOutLoanWithNFTs(
      { request: craReturn.request, responses: craReturn.responses },
      ownedNFTs
    )

  // return our transaction and our helper variables
  return {
    tx,
    getHelpers: async (): Promise<LoanHelpersReturn> => {
      await tx
      const allBorrowerLoans = await diamond.getBorrowerLoans(borrower)
      const loanID = allBorrowerLoans[allBorrowerLoans.length - 1].toString()
      return await loanHelpers(hre, loanID)
    },
  }
}

// zkCRA helper functions
const serializeSecret = (secret: string) => {
  const serialized = new Array(8)
  for (let i = 0; i < 8; i++) {
    const start = 8 * (8 - i) - 8
    serialized[i] = secret.substr(2).substr(start, start + 8)
  }
  return serialized
}

export const outputCraValues = async () => {
  console.log('inside output cra values')
  // local variables
  var zokratesProvider: typeof ZoKratesProvider
  var compilationArtifacts: typeof CompilationArtifacts
  var keyPair: typeof SetupKeypair
  var computation: typeof ComputationResult
  var proof: typeof Proof
  console.log('initialized private variables')
  initialize().then(async (provider: typeof ZoKratesProvider) => {
    console.log('inside initialize')
    // set provider after initialization
    zokratesProvider = provider

    // zok file to compile
    const source = `import "hashes/sha256/256bitPadded.zok" as sha256
    def main(private u32[3][8] data, public field identifier) -> (u32, u32[3][8]):
      u32[3][8] commitments = data
      u32 MARKET_SCORE = 0
      u32 MASK = 0x0000000a
  
      for u32 i in 0..3 do
          MARKET_SCORE = MARKET_SCORE + data[i][0] & MASK
          commitments[i] = sha256(data[i])
      endfor
  
      return MARKET_SCORE,commitments`

    // compile into circuit
    console.log('about to compile source')
    compilationArtifacts = zokratesProvider.compile(source)
    console.log('compiled source')

    // generate keypair
    keyPair = zokratesProvider.setup(compilationArtifacts.program)
    console.log('got keypair')

    // get borrower nonce and identifier
    const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
    console.log('got diamond')
    const borrower = (await getNamedAccounts()).borrower
    console.log('got borrower')
    const { length: nonce } = await diamond.getBorrowerLoans(borrower)
    console.log('got nonce')
    const identifier = BigNumber.from(borrower).xor(nonce)
    console.log('got identifier')

    // sample data. first element of each array element is the value (Score).
    // next 7 elements are the secrets
    const data = [
      [
        '0x0000000a',
        '0x00000000',
        '0x00000000',
        '0x00000000',
        '0x00000000',
        '0x00000000',
        '0x00000000',
        '0x00000001',
      ],
      [
        '0x0000000a',
        '0x00000000',
        '0x00000000',
        '0x00000000',
        '0x00000000',
        '0x00000000',
        '0x00000000',
        '0x00000002',
      ],
      [
        '0x0000000a',
        '0x00000000',
        '0x00000000',
        '0x00000000',
        '0x00000000',
        '0x00000000',
        '0x00000000',
        '0x00000003',
      ],
    ]

    // get computation
    console.log('about to get computation')
    computation = zokratesProvider.computeWitness(compilationArtifacts, [
      data,
      identifier.toString(),
    ])
    console.log(computation.witness)

    // compute proof
    console.log('about to get proof')
    proof = zokratesProvider.generateProof(
      compilationArtifacts.program,
      computation.witness,
      keyPair.pk
    )
    console.log(proof)
  })

  // return all the values so that we can verify transaction in the tests
  return {
    computation: computation,
    proof: proof,
  }
}

// we fill zkCRAConfigInfo before we sign
export const fillZKCRAConfigInfo = async () => {
  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')

  // get signers
  const signerOne = '0x592000b2c8c590531d490893C16AfC4b9cbbe6B9'
  const signerTwo = '0xd59e99927018b995ee9Ad6b9003677f1e7393F8A'
  const signerThree = '0xa243A7b4e9AF8D7e87a5443Aa7E21AB27624eaaA'
  console.log('got signers')

  console.log('about to initialize config admin')
  const deployer = await getNamedSigner('deployer')
  await diamond.connect(deployer).initializeConfigAdmins()
  console.log('initialized config admin')

  // set signers for the providerIds
  console.log('setting provider signers')
  await diamond
    .connect(deployer)
    .setProviderSigner(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      signerOne,
      true
    )
  await diamond
    .connect(deployer)
    .setProviderSigner(
      '0x0000000000000000000000000000000000000000000000000000000000000001',
      signerTwo,
      true
    )
  await diamond
    .connect(deployer)
    .setProviderSigner(
      '0x0000000000000000000000000000000000000000000000000000000000000002',
      signerThree,
      true
    )
  console.log('set signers on 3 provider ids')

  // create config
  console.log('setting market config')
  const maxAge_ = moment.duration(10, 'hours').asSeconds()
  for (let i = 0; i < 3; i++) {
    const providerConfig = {
      maxAge: maxAge_,
      providerId:
        '0x000000000000000000000000000000000000000000000000000000000000000' +
        i.toString(),
    }
    // set market provider config in a loop
    await diamond
      .connect(deployer)
      .setMarketProviderConfig(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        i,
        providerConfig
      )
    console.log('provider config #' + i + ' set.')
  }
}

// take out function with zkcra implemented
export const borrowWithZKCRA = async (args: CreateLoanWithZKCRA) => {
  // get proof and witness from args
  const { proof, computation } = args
  // computation.witness.output[2-10]
  // computation.witnes

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')

  // signers
  const signerOne = ethers.provider.getSigner(
    '0xAFe87013dc96edE1E116a288D80FcaA0eFFE5fe5'
  )
  const signerTwo = ethers.provider.getSigner(
    '0xd59e99927018b995ee9Ad6b9003677f1e7393F8A'
  )
  const signerThree = ethers.provider.getSigner(
    '0xa243A7b4e9AF8D7e87a5443Aa7E21AB27624eaaA'
  )

  // first signature
  const timestampOne = moment().unix()
  const messageOne = BigNumber.from(computation.witness.output.slice(10, 18))
    .xor(timestampOne)
    .toString()
  const credentialsSignerOne = await signerOne.signMessage(messageOne)

  // marketId
  const timestampTwo = moment().unix()
  const messageTwo = BigNumber.from(computation.witness.output.slice(10, 18))
    .xor(timestampTwo)
    .toString()
  const credentialsSignerTwo = await signerOne.signMessage(messageOne)

  const timestampThree = moment().unix()
  const messageThree = BigNumber.from(computation.witness.output.slice(18, 26))
    .xor(timestampThree)
    .toString()
  const credentialsSignerThree = await signerOne.signMessage(messageOne)

  // sign then store
  const signatureData = {}
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
  hre: HardhatRuntimeEnvironment,
  loanID: BigNumberish
): Promise<LoanDetailsReturn> => {
  const { contracts, tokens } = hre
  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  const loan = await diamond.getLoan(loanID)
  const lendingToken = await tokens.get(loan.lendingToken)
  const collateralToken = await tokens.get(loan.collateralToken)
  const debt = await diamond.getDebtOwed(loan.id)
  const totalOwed = debt.principalOwed.add(debt.interestOwed)
  const terms = await diamond.getLoanTerms(loan.id)
  const signer = await hre.ethers.provider.getSigner(loan.borrower)
  return {
    loan,
    lendingToken,
    collateralToken,
    debt,
    totalOwed,
    terms,
    borrower: { address: loan.borrower, signer },
    refresh: () => loanDetails(hre, loanID),
  }
}

interface CommonLoanArgs {
  diamond: ITellerDiamond
  details: LoanDetailsReturn
  from?: Signer
}

interface DepositCollateralArgs extends CommonLoanArgs {
  amount?: BigNumberish
}

const depositCollateral = async (
  hre: HardhatRuntimeEnvironment,
  args: DepositCollateralArgs
): Promise<ContractTransaction> => {
  const {
    diamond,
    details,
    amount = await collateralNeeded({ diamond, details }),
    from = details.borrower.signer,
  } = args
  const { tokens } = hre
  const weth = await tokens.get('WETH')
  const collateralToken = await tokens.get(details.loan.collateralToken)
  const options: PayableOverrides = {}
  if (
    hre.ethers.utils.getAddress(details.loan.collateralToken) ==
    hre.ethers.utils.getAddress(weth.address)
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
  const { neededInCollateralTokens } =
    await diamond.callStatic.getCollateralNeededInfo(details.loan.id)
  return neededInCollateralTokens
}
interface CollateralCurrentArgs extends CommonLoanArgs {}
const collateralCurrent = async (
  args: CollateralCurrentArgs
): Promise<BigNumber> => {
  const { diamond, details } = args
  return await diamond.getLoanCollateral(details.loan.id)
}
export interface RepayLoanArgs extends CommonLoanArgs {
  amount: BigNumberish
}
export const repayLoan = async (
  args: RepayLoanArgs
): Promise<ContractTransaction> => {
  const {
    diamond,
    details: { loan, borrower },
    amount,
    from = borrower.signer,
  } = args
  return await diamond.connect(from).repayLoan(loan.id, amount)
}
export const escrowRepayLoan = async (
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
