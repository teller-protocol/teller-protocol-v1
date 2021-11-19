import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { BigNumberish } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { ERC20, ITellerDiamond, ITToken } from '../../types/typechain'
import { getFunds } from '../helpers/get-funds'

chai.should()
chai.use(solidity)

export interface FundedMarketArgs {
  assetSym: string
  // Amount should be denoted in decimal value for the token (i.e. 100 = 100 * (10^tokenDecimals)
  amount?: BigNumberish
  tags?: string[]
  // fund?: boolean
  keepExistingDeployments?: boolean
}

export interface FundedMarketReturn {
  diamond: ITellerDiamond
  lendingToken: ERC20
}

export const fundedMarket = async (
  hre: HardhatRuntimeEnvironment,
  opts: FundedMarketArgs
): Promise<FundedMarketReturn> => {
  const { contracts, deployments, tokens } = hre

  const { tags, keepExistingDeployments } = Object.assign(opts, {
    tags: [],
    keepExistingDeployments: true,
    ...opts,
  })

  tags.push('markets')
  await deployments.fixture(tags, {
    keepExistingDeployments,
  })

  return await depositFunds(hre, opts)
}

const depositFunds = async (
  hre: HardhatRuntimeEnvironment,
  args: FundedMarketArgs
): Promise<FundedMarketReturn> => {
  const { contracts, tokens, getNamedSigner, toBN } = hre
  const { assetSym, amount } = args

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  const lendingToken = await tokens.get(assetSym)
  const maxTVL = await diamond.getMaxTVLAmount(lendingToken.address)

  // Fund the market
  let amountToFundLP: BigNumberish
  if (amount) {
    const decimals = await lendingToken.decimals()
    amountToFundLP = toBN(amount, decimals)
  } else {
    amountToFundLP = maxTVL
  }

  const funder = await getNamedSigner('funder')
  await getFunds({
    to: funder,
    tokenSym: assetSym,
    amount: amountToFundLP,
    hre,
  })
  await lendingToken.connect(funder).approve(diamond.address, amountToFundLP)
  await diamond
    .connect(funder)
    .lendingPoolDeposit(lendingToken.address, amountToFundLP)

  return {
    diamond,
    lendingToken,
  }
}
