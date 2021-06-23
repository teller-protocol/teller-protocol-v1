// external packages
import { isBytesLike } from '@ethersproject/bytes'
import { toUtf8Bytes } from '@ethersproject/strings'
import { time, timeStamp } from 'console'
import { createSign } from 'crypto'
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

// zkcra imports
import {
  initialize,
  ZoKratesProvider,
  CompilationArtifacts,
  ComputationResult,
  Proof,
  SetupKeypair,
  //@ts-ignore
} from 'zokrates-js/node'
import fetch from 'node-fetch'
// import zkcra from '../fixtures/zkcra.json'
// const out = 'https://ipfs.io/ipfs/QmeWAsv22oPBK2Rk8Jdj49CGjpz8fMivSzozmvARWGVqY8?filename=out'
const zkcraJson = `https://ipfs.io/ipfs/QmPRctNbW2q1TdrJAp2E1CkafJuCEzDKYtrqpYoHDkpXuR?filename=zkcra.json`
import scores from '../fixtures/zk-scores.json'

// teller files
import { getNFT } from '../../config'
import { claimNFT, getLoanMerkleTree, setLoanMerkle } from '../../tasks'
import { ERC20, ITellerDiamond, TellerNFT } from '../../types/typechain'
import { getFunds } from './get-funds'
import { mockCRAResponse } from './mock-cra-response'

import { readFileSync, writeFile, writeFileSync } from 'fs'
import { join } from 'path'
import { JsonRpcBatchProvider } from '@ethersproject/providers'
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
  proof: Proof
  computation: ComputationResult
}

interface ZKCRAHelpersReturn {
  computation: ComputationResult
  proof: Proof
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

// we fill zkCRAConfigInfo before we sign
export const fillZKCRAConfigInfo = async () => {
  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')

  // get signers (providers)
  const { craSigner } = await getNamedAccounts()

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
      craSigner,
      true
    )
  await diamond
    .connect(deployer)
    .setProviderSigner(
      '0x0000000000000000000000000000000000000000000000000000000000000001',
      craSigner,
      true
    )
  await diamond
    .connect(deployer)
    .setProviderSigner(
      '0x0000000000000000000000000000000000000000000000000000000000000002',
      craSigner,
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

export const outputCraValues = async (
  goodScore: boolean
): Promise<CreateLoanWithZKCRA> => {
  console.log('inside output cra values')
  // local variables
  let zokratesProvider: ZoKratesProvider
  let compilationArtifacts: CompilationArtifacts
  let keyPair: SetupKeypair
  let computation: ComputationResult
  let proof: Proof
  console.log('initialized private variables')
  // set provider after initialization
  const provider: ZoKratesProvider = await initialize()
  console.log('got provider')
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
  // const uint8Array = new Uint8Array(JSON.parse(JSON.stringify(zkcra)).program)
  console.log('fetching zkcra json')
  let zkcra: any
  try {
    zkcra = await fetch(zkcraJson)
  } catch (err) {
    console.log('error found: ' + err)
  }
  console.log('fetched')
  const response = await zkcra.json()
  console.log(response)
  const uint8Array = new Uint8Array(response.program.data)
  const abi = response.abi
  const compArtifact = { program: uint8Array, abi: abi }
  console.log(compArtifact)

  // compile into circuit
  // console.log('about to compile source')
  // compilationArtifacts = provider.compile(source)
  // console.log('compiled source')
  // const programArray = compilationArtifacts.program
  // const programBuffer = programArray.buffer
  // const objectToAdd = {
  //   program: Buffer.from(programBuffer),
  //   abi: compilationArtifacts.abi,
  // }
  // console.log(JSON.stringify(objectToAdd))
  // writeFileSync(
  //   join(__dirname, '../fixtures/zkcra.json'),
  //   JSON.stringify(objectToAdd),
  //   { encoding: 'utf-8' }
  // )

  // generate keypair
  // keyPair = provider.setup(compilationArtifacts.program)
  // console.log('got keypair')

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

  // get computation
  console.log('getting proof')
  if (goodScore) {
    computation = provider.computeWitness(compArtifact, [
      scores.good,
      identifier.toString(),
    ])
  } else {
    computation = provider.computeWitness(compArtifact, [
      scores.bad,
      identifier.toString(),
    ])
  }
  console.log('got proof')

  // compute proof
  const provingKey = new Uint8Array(
    readFileSync(
      join(__dirname, '../../contracts/market/cra/proving.key')
    ).buffer
  )

  console.log('about to get proof')
  proof = provider.generateProof(
    compArtifact.program,
    computation.witness,
    provingKey
  )
  console.log('proof')
  return {
    computation: computation,
    proof: proof,
  }
}
// take out function with zkcra implemented
export const borrowWithZKCRA = async (
  args: CreateLoanWithZKCRA
): Promise<ContractTransaction> => {
  console.log('borrowing with zkcra')

  // get proof and witness from args
  const { proof, computation } = args

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  console.log('getting signers')

  // cutting the proof inputs and concatenating them into our input variables
  const firstInput =
    '0x' +
    proof.inputs
      .slice(2, 10)
      .map((input: string) => input.substr(2).substr(56))
      .join('')

  const secondInput =
    '0x' +
    proof.inputs
      .slice(10, 18)
      .map((input: string) => input.substr(2).substr(56))
      .join('')

  const thirdInput =
    '0x' +
    proof.inputs
      .slice(18, 26)
      .map((input: string) => input.substr(2).substr(56))
      .join('')

  console.log('input one: ' + firstInput)
  console.log('input two: ' + secondInput)
  console.log('input three: ' + thirdInput)
  // get the signer
  const signer = await getNamedSigner('craSigner')
  const signerAddress = await signer.getAddress()
  console.log("signer's address: " + signerAddress)
  // get the time stamp
  const timestampOne = moment().unix()
  // create our message

  const messageOne = ethers.BigNumber.from(firstInput)
    .xor(timestampOne)
    .toHexString()

  console.log({ messageOne: BigNumber.from(messageOne).toString() })
  // signing first message
  const credentialsSignerOne = await signer.signMessage(
    ethers.utils.arrayify(messageOne)
  )
  // split our signature
  const sigOne = ethers.utils.splitSignature(credentialsSignerOne)

  // construct our signature data to pass onchain
  const signatureDataOne = {
    signature: {
      v: sigOne.v,
      r: sigOne.r,
      s: sigOne.s,
    },
    signedAt: timestampOne,
  }
  console.log({ signatureDataOne })

  // second signature
  const timestampTwo = moment().unix()
  const messageTwo = ethers.BigNumber.from(secondInput)
    .xor(timestampTwo)
    .toHexString()
  console.log({ messageTwo: BigNumber.from(messageTwo.toString()).toString() })
  const credentialsSignerTwo = await signer.signMessage(
    ethers.utils.arrayify(messageTwo)
  )
  const sigTwo = ethers.utils.splitSignature(credentialsSignerTwo)
  const signatureDataTwo = {
    signature: {
      v: sigTwo.v,
      r: sigTwo.r,
      s: sigTwo.s,
    },
    signedAt: timestampTwo,
  }
  console.log(signatureDataTwo)

  // third signature
  const timestampThree = moment().unix()
  const messageThree = ethers.BigNumber.from(thirdInput)
    .xor(timestampThree)
    .toHexString()
  console.log({
    messageThree: BigNumber.from(messageThree.toString()).toString(),
  })
  const credentialsSignerThree = await signer.signMessage(
    ethers.utils.arrayify(messageThree)
  )
  console.log('message three done')
  console.log('credentials')
  const sigThree = ethers.utils.splitSignature(credentialsSignerThree)
  const signatureDataThree = {
    signature: {
      v: sigThree.v,
      r: sigThree.r,
      s: sigThree.s,
    },
    signedAt: timestampThree,
  }

  console.log('all our signature data created')

  // all borrow variables
  const marketId_ =
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  const proof_ = proof
  const witness_ = proof.inputs
  const request = {
    collateralAssets: ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'],
    loanToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
    collateralAmounts: [10],
    loanAmount: 100,
    duration: moment.duration(1, 'day').asSeconds(),
  }
  const borrower = (await getNamedAccounts()).borrower
  const signerBorrower = await ethers.provider.getSigner(borrower)
  const tx = await diamond
    .connect(signerBorrower)
    .borrow(
      marketId_,
      { a: proof_.proof.a, b: proof_.proof.b, c: proof_.proof.c },
      witness_,
      [signatureDataOne, signatureDataTwo, signatureDataThree],
      request
    )
  return tx
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
