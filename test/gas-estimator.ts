import hre from 'hardhat'

import { fundedMarket } from './fixtures'
import { mockCRAResponse } from './helpers/mock-cra-response'
import { getFunds } from './helpers/get-funds'
import { writeFileSync } from 'fs'
import { join } from 'path'

const { deployments, fastForward, toBN, getNamedSigner } = hre

const setup = deployments.createFixture(
  async (): Promise<any> => {
    return await fundedMarket({ amount: 50000 })
  }
)
const gasEstimation: [string, string, string, string][] = []

after(() => {
  if (process.env.CI)
    writeFileSync(
      join(__dirname, '../gas-estimation.json'),
      JSON.stringify(gasEstimation)
    )
})

describe('LendingPool', async () => {
  it('estimate gas for deposit & withdrawing from a lending pool', async () => {
    let market = await setup()
    // Get Lending Pool contract
    let lendingPool = market.lendingPool
    // Get lender
    let lender = await getNamedSigner('lender')
    // Fund lender
    let lendingAmount = await toBN('2000', '18')
    await getFunds({
      to: lender,
      tokenSym: 'DAI',
      amount: lendingAmount,
    })
    // Approve tokens
    await market.lendingToken
      .connect(lender)
      .approve(lendingPool.address, lendingAmount)
    // Estimate gas for depositing
    let depositEstimate = await lendingPool
      .connect(lender)
      .estimateGas.deposit(lendingAmount)
    // Deposit collateral
    await lendingPool.connect(lender).deposit(lendingAmount)
    // Move ahead in time
    await fastForward(1000)
    // Estimate gas for withdrawing
    let withdrawEstimate = await lendingPool
      .connect(lender)
      .estimateGas.withdrawAll()
    let lpTableData = [
      { Method: 'LP Deposit', GasCost: depositEstimate.toString() },
      { Method: 'LP Withdraw', GasCost: withdrawEstimate.toString() },
    ]
    console.table(lpTableData)
    lpTableData
      .map(
        (obj) =>
          [
            new Date().toUTCString(),
            'LendingPool',
            obj.Method,
            obj.GasCost,
          ] as [string, string, string, string]
      )
      .forEach((row) => gasEstimation.push(row))
  })
})

describe('Loans', async () => {
  it('estimate gas for the lifecycle of a loan', async () => {
    let market = await setup()
    // Get Loans contract
    let loans = market.loans
    // Get borrower
    let borrower = await getNamedSigner('borrower')
    // Get lending token
    let lendingToken = await market.lendingToken
    // Set loan amount
    let loanAmount = toBN('1000', await lendingToken.decimals()).toString()
    // Mock loan request and node response
    let { request, response } = await mockCRAResponse({
      lendingToken: market.lendTokenSym,
      collateralToken: market.collTokenSym,
      loanAmount,
      loanTermLength: '60',
      collateralRatio: '15000',
      interestRate: '2000',
      borrower: await borrower.getAddress(),
    })
    // Estimate gas for creating a loan
    let createLoanEstimate = await loans
      .connect(borrower)
      .estimateGas.createLoanWithTerms(request, [response], '0')
    await fastForward(100)
    // Create the loan
    await loans.connect(borrower).createLoanWithTerms(request, [response], '0')
    // Move ahead in time
    await fastForward(100)
    // Get loan id
    let allBorrowerLoans = await loans.getBorrowerLoans(borrower.getAddress())
    let loanId = allBorrowerLoans[allBorrowerLoans.length - 1].toString()
    // Get collateral owed
    let collateral = (await loans.getCollateralInfo(0)).neededInCollateralTokens
    // Estimate gas for depositing collateral
    let depositCollateralEstimate = await loans
      .connect(borrower)
      .estimateGas.depositCollateral(
        borrower.getAddress(),
        loanId,
        collateral,
        { value: collateral }
      )
    // Deposit the collateral
    await loans
      .connect(borrower)
      .depositCollateral(borrower.getAddress(), loanId, collateral, {
        value: collateral,
      })
    // Move ahead in time
    await fastForward(1000)
    // Estimate gas for taking out the loan
    let takeOutLoanEstimate = await loans
      .connect(borrower)
      .estimateGas.takeOutLoan(loanId, loanAmount)
    // Take out the loan
    await loans.connect(borrower).takeOutLoan(loanId, loanAmount)
    // Move ahead in time
    await fastForward(100)
    // Approve tokens
    await market.lendingToken
      .connect(borrower)
      .approve(market.lendingPool.address, loanAmount)
    // Estimate gas for to repay the loan
    let repayLoanEstimate = await loans
      .connect(borrower)
      .estimateGas.repay(loanAmount, loanId)
    // Repay the loan
    let repaymentAmount = toBN('500', '18')
    let collateralWithdrawalAmount = collateral.div(2)
    await loans.connect(borrower).repay(repaymentAmount, loanId)
    // Move ahead in time
    await fastForward(100)
    // Estimate gas for to withdraw collateral
    let withdrawCollateralEstimate = await loans
      .connect(borrower)
      .estimateGas.withdrawCollateral(collateralWithdrawalAmount, loanId)
    let loansTableData = [
      { Method: 'Creating a loan', GasCost: createLoanEstimate.toString() },
      {
        Method: 'Depositing collateral',
        GasCost: depositCollateralEstimate.toString(),
      },
      { Method: 'Taking out a loan', GasCost: takeOutLoanEstimate.toString() },
      { Method: 'Repaying a loan', GasCost: repayLoanEstimate.toString() },
      {
        Method: 'Withdrawing collateral',
        GasCost: withdrawCollateralEstimate.toString(),
      },
    ]
    console.table(loansTableData)
    loansTableData
      .map(
        ({ GasCost, Method }) =>
          [new Date().toUTCString(), 'Loans', Method, GasCost] as [
            string,
            string,
            string,
            string
          ]
      )
      .forEach((row) => gasEstimation.push(row))
  })
})
