import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'

import { mockCRAResponse } from '../helpers/mock-cra-response'
import { setTestEnv, TestEnv } from '../helpers/set-test-env'

chai.should()
chai.use(solidity)

setTestEnv('Loans - Secured', (testEnv: TestEnv) => {
  it('Sanity check - Should be able to successfully deposit as a lender', async () => {
    const { tellerDiamond, lender, dai } = testEnv
    // Balance before lending
    const lenderBalanceBefore = await dai.balanceOf(await lender.getAddress())
    // Approve diamond
    await dai.connect(lender).approve(tellerDiamond.address, '10000')
    // Deposit funds as lender
    await tellerDiamond.connect(lender).lendingPoolDeposit(dai.address, '10000')
    // Balance after lending
    const lenderBalanceAfter = await dai.balanceOf(await lender.getAddress())
    expect(lenderBalanceBefore).to.be.gt(lenderBalanceAfter)
  })

  it('Should be able to successfully take out a secured loan', async () => {
    const { tellerDiamond, borrower, dai, weth, priceAggregator } = testEnv

    // Loan params
    const lendingToken = dai
    const collateralToken = weth
    const collateralRatio = 75
    const interestRate = '400'
    const loanDuration = '84600'
    const loanAmount = '1000'

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

    // Approve diamond
    await collateralToken.connect(borrower).approve(tellerDiamond.address, '1')

    // Get collateral required from price aggregator
    const collAmount = await priceAggregator.getValueFor(
      lendingToken.address,
      collateralToken.address,
      loanAmount
    )

    // Take out loan
    await tellerDiamond
      .connect(borrower)
      .takeOutLoan(
        { request: craReturn.request, responses: craReturn.responses },
        collateralToken.address,
        collAmount
      )

    const loansAfter = await tellerDiamond.getBorrowerLoans(
      await borrower.getAddress()
    )

    expect(loansAfter.length).to.be.gt(loansBefore.length)
  })
})
