/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Signer } from 'ethers'
import hre from 'hardhat'

import { updatePlatformSetting } from '../../tasks'
import {
  ERC20,
  ITellerDiamond,
  PriceAggregator,
  TellerNFT,
} from '../../types/typechain'
import { getFunds } from './get-funds'
import { evmRevert, evmSnapshot } from './misc'

export interface TestEnv {
  deployer: Signer
  lender: Signer
  borrower: Signer
  tellerDiamond: ITellerDiamond
  priceAggregator: PriceAggregator
  nft: TellerNFT
  dai: ERC20
  weth: ERC20
}

const testEnv: TestEnv = {
  deployer: {} as Signer,
  lender: {} as Signer,
  borrower: {} as Signer,
  tellerDiamond: {} as ITellerDiamond,
  priceAggregator: {} as PriceAggregator,
  nft: {} as TellerNFT,
  dai: {} as ERC20,
  weth: {} as ERC20,
} as TestEnv

const { contracts, deployments, getNamedSigner, tokens } = hre

export async function initTestEnv() {
  // Get accounts
  testEnv.deployer = await getNamedSigner('deployer')
  testEnv.lender = await getNamedSigner('lender')
  testEnv.borrower = await getNamedSigner('borrower')

  // Get a fresh market
  await deployments.fixture('markets', {
    keepExistingDeployments: true,
  })

  testEnv.tellerDiamond = await contracts.get('TellerDiamond')
  testEnv.priceAggregator = await contracts.get('PriceAggregator')

  // Fund lender
  await getFunds({
    to: testEnv.lender,
    tokenSym: 'DAI',
    amount: '1000000',
    hre,
  })

  // Set tokens
  testEnv.dai = await tokens.get('DAI')
  testEnv.weth = await tokens.get('WETH')

  // Approve diamond
  await testEnv.dai
    .connect(testEnv.lender)
    .approve(testEnv.tellerDiamond.address, '10000')

  // Deposit funds as lender
  await testEnv.tellerDiamond
    .connect(testEnv.lender)
    .lendingPoolDeposit(testEnv.dai.address, '10000')

  // Fund borrower with ETH
  await getFunds({
    to: testEnv.borrower,
    tokenSym: 'WETH',
    amount: '10',
    hre,
  })

  // Mint an NFT for the borrower
  testEnv.nft = await contracts.get('TellerNFT')
  await testEnv.nft
    .connect(testEnv.deployer)
    .mint(0, await testEnv.borrower.getAddress())

  // Set singer responses to 1
  const percentageSubmission = {
    name: 'RequiredSubmissionsPercentage',
    value: 100,
  }
  await updatePlatformSetting(percentageSubmission, hre)
}

export function setTestEnv(name: string, tests: (testEnv: TestEnv) => void) {
  describe(name, () => {
    before(async () => {
      await initTestEnv()
      await setSnapshot()
    })
    tests(testEnv)
    after(async () => {
      await revertHead()
    })
  })
}

const setSnapshot = async () => {
  setHardhatEvmSnapshotId(await evmSnapshot())
}

let hardhatEvmSnapshotId = '0x1'
const setHardhatEvmSnapshotId = (id: string) => {
  hardhatEvmSnapshotId = id
}

const revertHead = async () => {
  await evmRevert(hardhatEvmSnapshotId)
}
