import Chai from 'chai'
import Mocha from 'mocha'
import { Signer, BigNumber, ContractTransaction } from 'ethers'
import moment from 'moment'

import { Test } from 'mocha'
import {
  TestScenario,
  STORY_ACTIONS,
  TestAction,
  LoanSnapshots,
} from '../story-helpers'
import StoryTestDriver from './story-test-driver'

import hre, { contracts, getNamedSigner, ethers } from 'hardhat'

import { getPlatformSetting, updatePlatformSetting } from '../../../../tasks'
import { ITellerDiamond } from '../../../../types/typechain'
import { getMarkets } from '../../../../config'
import { getFunds } from '../../get-funds'
import {
  LoanType,
  loanHelpers,
  takeOutLoanWithoutNfts,
  takeOutLoanWithNfts,
  CreateLoanArgs,
  repayLoan,
  RepayLoanArgs,
  LoanHelpersReturn,
} from '../../loans'
import Prando from 'prando'
let rng = new Prando('teller-v1')

var expect = Chai.expect

/*
We will read state data from the chaindata to determine whether or not each 'action' should pass or fail at the current moment 
Then we will expect that 
*/

export default class LoanStoryTestDriver extends StoryTestDriver {
  static generateDomainSpecificTestsForScenario(
    scenario: TestScenario
  ): Array<Test> {
    let allTests: Array<Test> = []

    let scenarioActions = scenario.actions

    for (let action of scenarioActions) {
      let testsForAction: Array<Test> =
        LoanStoryTestDriver.generateTestsForAction(action)
      allTests = allTests.concat(testsForAction)
    }

    return allTests
  }

  static generateTestsForAction(action: TestAction): Array<Test> {
    // SNAPSHOTS.revert = await hre.evm.snapshot()

    let tests: Array<Test> = []

    const { actionType, args } = action
    switch (actionType) {
      case STORY_ACTIONS.LOAN.TAKE_OUT: {
        let newTest = new Test('take out loan', async function () {
          const percentageSubmission = {
            name: 'RequiredSubmissionsPercentage',
            value: 0,
          }
          await updatePlatformSetting(percentageSubmission, hre)
          const { value: rateLimit } = await getPlatformSetting(
            'RequestLoanTermsRateLimit',
            hre
          )
          await hre.evm.advanceTime(rateLimit)
          const borrowerAddress = (await hre.getNamedAccounts()).borrower
          const createArgs = LoanStoryTestDriver.createLoanArgs(borrowerAddress)
          const funcToRun =
            args.nft == true ? takeOutLoanWithNfts : takeOutLoanWithoutNfts
          if (args.pass) {
            const { tx, getHelpers } = await funcToRun(createArgs)
            LoanSnapshots[STORY_ACTIONS.LOAN.TAKE_OUT] =
              await hre.evm.snapshot()
            expect(tx)
          } else {
            expect(await funcToRun(createArgs)).to.throw()
          }
          // expect(1).to.equal(1)
          // const result = await tx

          // console.log('done here: %o', result.hash)
          // LoanSnapshots[STORY_ACTIONS.LOAN.TAKE_OUT] = await hre.evm.snapshot()
          // done()
        })
        console.log('push STORY_ACTIONS.LOAN.TAKE_OUT test! ')
        tests.push(newTest)
        break
      }
      case STORY_ACTIONS.LOAN.REPAY: {
        let newTest = new Test('Repay loan', async function () {
          if (args.parent) await LoanSnapshots[args.parent]()
          if (args.pass) {
            const tx = await LoanStoryTestDriver.repayLoan()
            expect(tx).to.exist
          } else {
            expect(await LoanStoryTestDriver.repayLoan()).to.throw()
          }
        })
        console.log('push STORY_ACTIONS.LOAN.REPAY test ! ')
        tests.push(newTest)
        break
      }
      case STORY_ACTIONS.LOAN.LIQUIDATE: {
        let newTest = new Test('Liquidate loan', async function () {
          if (args.parent) await LoanSnapshots[args.parent]()
          if (args.pass) {
            const tx = await LoanStoryTestDriver.liquidateLoan()
            expect(tx).to.exist
          } else {
            expect(await LoanStoryTestDriver.liquidateLoan()).to.throw()
          }
          // expect(1).to.equal(1)
        })
        console.log('push STORY_ACTIONS.LOAN.LIQUIDATE test ! ')
        tests.push(newTest)
        break
      }
    }
    return tests
  }

  static createLoanArgs = (borrower: string): CreateLoanArgs => {
    const { network } = hre
    const markets = getMarkets(network)
    const randomMarket = rng.nextInt(0, markets.length - 1)
    const market = markets[randomMarket]
    // console.log({ markets })
    const randomCollateralToken = rng.nextInt(
      0,
      market.collateralTokens.length - 1
    )
    const randomLoanType = rng.nextInt(
      0,
      Object.values(LoanType).length / 2 - 1
    )
    return {
      lendToken: market.lendingToken,
      collToken: market.collateralTokens[randomCollateralToken],
      borrower,
      loanType: randomLoanType,
    }
  }

  static getLoan = async (borrower: Signer): Promise<LoanHelpersReturn> => {
    const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
    const allBorrowerLoans = await diamond.getBorrowerLoans(
      await borrower.getAddress()
    )
    console.log({ allBorrowerLoans })
    // expect(
    //   allBorrowerLoans.length,
    //   'allBorrowerLoans must be greater than 0'
    // ).to.be.greaterThan(0)
    if (allBorrowerLoans.length == 0) throw Error('No borrower loans')
    const loanID = allBorrowerLoans[allBorrowerLoans.length - 1].toString()
    return loanHelpers(loanID)
  }

  static liquidateLoan = async (): Promise<ContractTransaction> => {
    const borrowerAddress = (await hre.getNamedAccounts()).borrower
    const borrower = await hre.ethers.provider.getSigner(borrowerAddress)
    // console.log(borrower.)
    const loan = await LoanStoryTestDriver.getLoan(borrower)
    const { details, diamond, collateral } = loan
    await hre.evm.advanceTime(details.loan.duration)
    const liquidator = await hre.getNamedSigner('liquidator')
    let borrowedAmount = details.loan.borrowedAmount
    console.log({ borrowedAmount: borrowedAmount.toString() })
    const liquidatorAddress = await liquidator.getAddress()
    // const tokenBal = await details.lendingToken.balanceOf(liquidatorAddress)
    await getFunds({
      to: liquidatorAddress,
      tokenSym: await details.lendingToken.symbol(),
      amount: BigNumber.from(borrowedAmount).mul(2),
      hre,
    })
    await details.lendingToken
      .connect(liquidator)
      .approve(diamond.address, BigNumber.from(borrowedAmount).mul(2))
    const tx = await diamond.connect(liquidator).liquidateLoan(details.loan.id)
    return tx
  }

  static repayLoan = async (): Promise<ContractTransaction> => {
    const borrower = await getNamedSigner('borrower')
    const loan = await LoanStoryTestDriver.getLoan(borrower)
    const { details, diamond } = loan
    const borrowedAmount = 100
    // console.log({ borrowedAmount: borrowedAmount.toString() })
    const repayLoanArgs: RepayLoanArgs = {
      amount: details.loan.borrowedAmount,
      from: details.borrower.signer,
      diamond,
      details,
    }
    await hre.evm.advanceTime(moment.duration(10, 'minutes'))
    const borrowerAddress = await borrower.getAddress()
    await getFunds({
      to: borrowerAddress,
      tokenSym: await details.lendingToken.symbol(),
      amount: BigNumber.from(borrowedAmount).mul(2),
      hre,
    })
    const approve = await details.lendingToken
      .connect(borrower)
      .approve(diamond.address, BigNumber.from(borrowedAmount).mul(2))
    const tx = await repayLoan(repayLoanArgs)
    return tx
  }
}
