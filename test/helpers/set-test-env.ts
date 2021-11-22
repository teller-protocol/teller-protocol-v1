/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Signer } from 'ethers'
import hre, { toBN } from 'hardhat'

import {
  getPlatformSetting,
  getPrice,
  updatePlatformSetting,
} from '../../tasks'
import {
  ERC20,
  ITellerDiamond,
  MainnetTellerNFT,
  PolyTellerNFTMock,
  PriceAggregator,
  TTokenV3,
} from '../../types/typechain'
import { getFunds } from './get-funds'
import { evmRevert, evmSnapshot } from './misc'

export interface TokenData {
  name: string
  token: ERC20
}

export interface TestEnv {
  deployer: Signer
  lender: Signer
  borrower: Signer
  tellerDiamond: ITellerDiamond
  priceAggregator: PriceAggregator
  nft: PolyTellerNFTMock | MainnetTellerNFT
  tokens: TokenData[]
}

const testEnv: TestEnv = {
  deployer: {} as Signer,
  lender: {} as Signer,
  borrower: {} as Signer,
  tellerDiamond: {} as ITellerDiamond,
  priceAggregator: {} as PriceAggregator,
  nft: {} as PolyTellerNFTMock | MainnetTellerNFT,
  tokens: [] as TokenData[],
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
  testEnv.nft = await contracts.get('TellerNFT_V2')
  await testEnv.nft
    .connect(testEnv.deployer)
    .mint(await testEnv.borrower.getAddress(), 3, 6)

  const currentSetting = await getPlatformSetting(
    'RequiredSubmissionsPercentage',
    hre
  )

  if (currentSetting.value.toString() !== '100') {
    // Set singer responses to 1
    const percentageSubmission = {
      name: 'RequiredSubmissionsPercentage',
      value: 100,
    }
    await updatePlatformSetting(percentageSubmission, hre)
  }
}

export function setTestEnv(name: string, tests: (testEnv: TestEnv) => void) {
  describe.only(name, () => {
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

export const revertHead = async () => {
  await evmRevert(hardhatEvmSnapshotId)
}

const fundMarket = async (testEnv: TestEnv) => {
  const { tellerDiamond, lender } = testEnv
  // Get list of tokens
  const dai = await tokens.get('DAI')
  const collateralTokens = Array.from(
    await tellerDiamond.getCollateralTokens(dai.address)
  )
  collateralTokens.push(dai.address)
  // Deposit for each asset
  for (let i = 0; i < collateralTokens.length; i++) {
    // Load each collateral token address into an ERC20 contract
    const token: ERC20 = await contracts.get('ERC20', {
      at: collateralTokens[i],
    })
    const tToken: TTokenV3 = await contracts.get('TToken_V3', {
      at: await tellerDiamond.getTTokenFor(token.address),
    })
    const tokenName = await token.symbol()
    testEnv.tokens.push({ name: tokenName, token: token })
    const fundAmount = await getPrice(
      { src: 'DAI', dst: tokenName, amount: '10000' },
      hre
    )
    const bnedAmount = toBN(fundAmount.value, await token.decimals())
    // Get funds for lender
    await getFunds({
      to: lender,
      tokenSym: await token.symbol(),
      amount: bnedAmount,
      hre,
    })
    // Approve protocol
    await token
      .connect(lender)
      .approve(tToken.address, bnedAmount)
      .then(({ wait }) => wait())
    // Deposit funds
    await tToken
      .connect(lender)
      .mint(bnedAmount)
      .then(({ wait }) => wait())
  }
}
