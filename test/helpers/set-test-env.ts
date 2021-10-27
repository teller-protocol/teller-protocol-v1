/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Signer } from 'ethers'
import hre, { toBN } from 'hardhat'

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
  usdc: ERC20
  weth: ERC20
  link: ERC20
  wbtc: ERC20
}

const testEnv: TestEnv = {
  deployer: {} as Signer,
  lender: {} as Signer,
  borrower: {} as Signer,
  tellerDiamond: {} as ITellerDiamond,
  priceAggregator: {} as PriceAggregator,
  nft: {} as TellerNFT,
  dai: {} as ERC20,
  usdc: {} as ERC20,
  weth: {} as ERC20,
  link: {} as ERC20,
  wbtc: {} as ERC20,
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
  testEnv.usdc = await tokens.get('USDC')
  testEnv.weth = await tokens.get('WETH')
  testEnv.link = await tokens.get('LINK')
  testEnv.wbtc = await tokens.get('WBTC')

  // Fund market with tokens allowed by the protocol
  await fundMarket(testEnv)

  // Fund borrower with ETH
  await getFunds({
    to: testEnv.borrower,
    tokenSym: 'WETH',
    amount: '10',
    hre,
  })

  // Mint 6 NFTs for the borrower
  testEnv.nft = await contracts.get('TellerNFT')
  await testEnv.nft
    .connect(testEnv.deployer)
    .mint(0, await testEnv.borrower.getAddress())

  await testEnv.nft
    .connect(testEnv.deployer)
    .mint(0, await testEnv.borrower.getAddress())

  await testEnv.nft
    .connect(testEnv.deployer)
    .mint(0, await testEnv.borrower.getAddress())

  await testEnv.nft
    .connect(testEnv.deployer)
    .mint(0, await testEnv.borrower.getAddress())

  await testEnv.nft
    .connect(testEnv.deployer)
    .mint(0, await testEnv.borrower.getAddress())

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

const fundMarket = async (testEnv: TestEnv) => {
  const { tellerDiamond, dai, lender } = testEnv
  // Get list of tokens
  const collateralTokens = await tellerDiamond.getCollateralTokens(dai.address)
  // Deposit for each asset
  for (let i = 0; i < collateralTokens.length; i++) {
    // Load each collateral token address into an ERC20 contract
    const token = await contracts.get('ERC20', { at: collateralTokens[i] })
    const bnedAmount = toBN('1000', await token.decimals())
    // Get funds for lender
    await getFunds({
      to: lender,
      tokenSym: await token.symbol(),
      amount: bnedAmount,
      hre,
    })
    // Approve protocol
    await token.connect(lender).approve(tellerDiamond.address, bnedAmount)
    // Deposit funds
    await tellerDiamond
      .connect(lender)
      .lendingPoolDeposit(collateralTokens[i], bnedAmount)
  }
}
