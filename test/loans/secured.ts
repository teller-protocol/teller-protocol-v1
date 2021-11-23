import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'

import { getPlatformSetting } from '../../tasks'
import { TTokenV3 } from '../../types/typechain'
import { mockCRAResponse } from '../helpers/mock-cra-response'
import { revertHead, setTestEnv, TestEnv } from '../helpers/set-test-env'

chai.should()
chai.use(solidity)

setTestEnv('Loans - Secured', (testEnv: TestEnv) => {
  const securedLoan = async (
    lendingAsset: string,
    collateralAsset: string,
    amount: string
  ): Promise<void> => {
    const { tellerDiamond, borrower, priceAggregator, tokens } = testEnv

    let correctedCollAsset = collateralAsset
    if (collateralAsset == 'ETH') {
      correctedCollAsset = 'WETH'
    }

    // Loan params
    const lendingToken = tokens.find((o) => o.name === `${lendingAsset}`)!.token
    const collateralToken = tokens.find(
      (o) => o.name === `${correctedCollAsset}`
    )!.token
    const collateralRatio = 75
    const interestRate = '400'
    const loanDuration = '84600'
    const loanAmount = amount

    // CRA response
    const craReturn = await mockCRAResponse(hre, {
      lendingToken: lendingToken.address,
      loanAmount,
      loanTermLength: loanDuration,
      collateralRatio: collateralRatio,
      interestRate: interestRate,
      borrower: await borrower.getAddress(),
    })

    // Get active loans before borrowing
    const loansBefore = await tellerDiamond.getBorrowerLoans(
      await borrower.getAddress()
    )

    // Get collateral required from price aggregator
    const collAmount = await priceAggregator.getValueFor(
      lendingToken.address,
      collateralToken.address,
      loanAmount
    )

    // Approve diamond
    if (collateralAsset != 'ETH') {
      await collateralToken
        .connect(borrower)
        .approve(tellerDiamond.address, collAmount)
        .then(({ wait }) => wait())

      // Take out loan
      await tellerDiamond
        .connect(borrower)
        .takeOutLoan(
          { request: craReturn.request, responses: craReturn.responses },
          collateralToken.address,
          collAmount
        )
        .then(({ wait }) => wait())
    } else {
      // Take out loan
      await tellerDiamond
        .connect(borrower)
        .takeOutLoan(
          { request: craReturn.request, responses: craReturn.responses },
          collateralToken.address,
          collAmount,
          { value: collAmount }
        )
        .then(({ wait }) => wait())
    }

    const loansAfter = await tellerDiamond.getBorrowerLoans(
      await borrower.getAddress()
    )

    expect(loansAfter.length).to.be.gt(
      loansBefore.length,
      'Expected loans to increase'
    )
    await revertHead()
  }

  it('Sanity check - Should be able to successfully deposit as a lender', async () => {
    const { tellerDiamond, lender, tokens } = testEnv
    const dai = tokens.find((o) => o.name === 'DAI')!.token
    const tDai: TTokenV3 = await hre.contracts.get('TToken_V3', {
      at: await tellerDiamond.getTTokenFor(dai.address),
    })
    // Balance before lending
    const lenderBalanceBefore = await dai.balanceOf(await lender.getAddress())
    // Approve diamond
    await dai.connect(lender).approve(tDai.address, '10000')
    // Deposit funds as lender
    await tDai
      .connect(lender)
      .mint('10000')
      .then(({ wait }) => wait())
    // Balance after lending
    const lenderBalanceAfter = await dai.balanceOf(await lender.getAddress())
    expect(lenderBalanceBefore).to.be.gt(lenderBalanceAfter)
  })

  it('Should be able to successfully take out a secured loan w/ WETH collateral', async () => {
    await securedLoan('DAI', 'WETH', '1000')
  })

  it('Should be able to successfully take out a secured loan w/ ETH collateral', async () => {
    // Advance time
    const { value: rateLimit } = await getPlatformSetting(
      'RequestLoanTermsRateLimit',
      hre
    )
    await hre.evm.advanceTime(rateLimit)

    await securedLoan('DAI', 'ETH', '1000')
  })
})
