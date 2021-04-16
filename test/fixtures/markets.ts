import { BigNumberish } from 'ethers'
import { contracts, deployments, getNamedSigner, toBN, tokens } from 'hardhat'

import { ITellerDiamond } from '../../types/typechain'
import { getFunds } from '../helpers/get-funds'

export interface FundedMarketArgs {
  assetSym: string
  // Amount should be denoted in decimal value for the token (i.e. 100 = 100 * (10^tokenDecimals)
  amount?: number
}

export const fundedMarket = (args?: FundedMarketArgs): Promise<void> =>
  deployments.createFixture(async (_hre) => {
    const { assetSym = 'DAI', amount } = args ?? {}

    const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
    const lendingToken = await tokens.get(assetSym)

    // Fund the market
    let amountToFundLP: BigNumberish
    if (amount) {
      const decimals = await lendingToken.decimals()
      amountToFundLP = toBN(amount, decimals)
    } else {
      amountToFundLP = await diamond.getMaxTVLAmount(lendingToken.address)
    }

    const funder = await getNamedSigner('funder')
    await getFunds({
      to: funder,
      tokenSym: assetSym,
      amount: amountToFundLP,
    })
    await lendingToken.connect(funder).approve(diamond.address, amountToFundLP)
    await diamond
      .connect(funder)
      .lendingPoolDeposit(lendingToken.address, amountToFundLP)
  })()
