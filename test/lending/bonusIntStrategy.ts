import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { contracts, ethers, network, toBN } from 'hardhat'

import { ERC20, TTokenV3 } from '../../types/typechain'
import { getFunds } from '../helpers/get-funds'
import { advanceBlock } from '../helpers/misc'
import { setTestEnv, TestEnv } from '../helpers/set-test-env'

chai.should()
chai.use(solidity)

setTestEnv('Lending - TToken bonus interest', (testEnv: TestEnv) => {
  it.only('Should accurately dispense the bonus interest', async () => {
    // Load tToken
    const { tokens, tellerDiamond, lender, hre } = testEnv

    const dai: ERC20 = tokens.find((o) => o.name === 'DAI')!.token

    const tDai = await contracts.get<TTokenV3>('ITToken', {
      at: await tellerDiamond.getTTokenFor(dai.address),
    })

    const bnedAmount = toBN(1000, 18)

    // Get funds for lender
    await getFunds({
      to: lender,
      tokenSym: await dai.symbol(),
      amount: bnedAmount,
      hre,
    })

    // Deposit as lender
    const exchangeRateBefore = await tDai.callStatic.exchangeRate()
    const totalUnderlyingBefore = await tDai.callStatic.totalUnderlyingSupply()

    // Approve protocol
    await dai
      .connect(lender)
      .approve(tDai.address, bnedAmount)
      .then(({ wait }) => wait())
    // Deposit funds
    await tDai
      .connect(lender)
      .mint(bnedAmount)
      .then(({ wait }) => wait())

    // Advance time
    const currentBlockTimestamp = (
      await hre.ethers.provider.getBlock(
        await hre.ethers.provider.getBlockNumber()
      )
    ).timestamp

    await advanceBlock(currentBlockTimestamp + 6400) // block for a year

    // Check tToken total underlying
    const totalUnderlyingAfter = await tDai.callStatic.totalUnderlyingSupply()

    // Check tToken exchange rate
    const exchangeRateAfter = await tDai.callStatic.exchangeRate()

    // Assertions
    expect(totalUnderlyingAfter).to.be.gt(totalUnderlyingBefore.add(bnedAmount))
    expect(exchangeRateAfter).to.be.gt(exchangeRateBefore)
  })
})
