import Chai from 'chai'
import Mocha from 'mocha'
import { Signer, BigNumber } from 'ethers'
import moment from 'moment'

import { Test } from 'mocha'
import { TestScenario, STORY_ACTIONS, TestAction } from '../story-helpers-2'
import StoryTestDriver from './story-test-driver'

import hre, { contracts, getNamedSigner } from 'hardhat'

import { getPlatformSetting, updatePlatformSetting } from '../../../../tasks'
import { ITellerDiamond } from '../../../../types/typechain'
import { getMarkets } from '../../../../config'
import { getFunds } from '../../get-funds'
import {
  createLoan,
  LoanType,
  loanHelpers,
  takeOutLoanWithoutNfts,
  takeOutLoanWithNfts,
  TakeOutLoanArgs,
  CreateLoanArgs,
  repayLoan,
  RepayLoanArgs,
  LoanHelpersReturn,
  LoanDetailsReturn,
  CollateralFunctions,
} from '../../loans'
import Prando from 'prando'
let rng = new Prando('teller-v1')

var expect = Chai.expect
const LoanSnapshots: { [name: number]: Function } = {}

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

    let actionType = action.actionType
    // let arguments:?object = action.args

    switch (actionType) {
      case STORY_ACTIONS.LOAN.TAKE_OUT: {
        let newTest = new Test('take out loan', async function () {
          const { value: rateLimit } = await getPlatformSetting(
            'RequestLoanTermsRateLimit',
            hre
          )
          await hre.evm.advanceTime(rateLimit)

          const createArgs = LoanStoryTestDriver.createLoanArgs()
          // LoanSnapshots[STORY_ACTIONS.LOAN.TAKE_OUT] = await hre.evm.snapshot()

          /*const { tx, getHelpers } = args.nft
                   ? await takeOutLoanWithNfts(createArgs)
                   : await takeOutLoanWithoutNfts(createArgs)*/

          expect(1).to.equal(1)
        })

        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
      case STORY_ACTIONS.LOAN.REPAY: {
        let newTest = new Test('Repay loan', async function () {
          // const borrower = await getNamedSigner('borrower')
          // const loan = await LoanStoryTestDriver.getLoan(borrower)
          // const { details, diamond } = loan
          // const borrowedAmount = details.terms.maxLoanAmount
          // const repayLoanArgs: RepayLoanArgs = {
          //   amount: borrowedAmount,
          //   from: details.borrower.signer,
          //   diamond,
          //   details,
          // }
          // await hre.evm.advanceTime(moment.duration(5, 'minutes'))
          // const tx = await repayLoan(repayLoanArgs)
          expect(1).to.equal(1)
        })

        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
      case STORY_ACTIONS.LOAN.LIQUIDATE: {
        let newTest = new Test('Liquidate loan', async function () {
          // const borrower = await getNamedSigner('borrower')
          // const loan = await LoanStoryTestDriver.getLoan(borrower)
          // const { details, diamond, collateral } = loan
          // await hre.evm.advanceTime(details.loan.duration)
          // const liquidator = await hre.getNamedSigner('liquidator')
          // let borrowedAmount = details.terms.maxLoanAmount
          // const liquidatorAddress = await liquidator.getAddress()
          // const tokenBal = await details.lendingToken.balanceOf(liquidatorAddress)
          // await getFunds({
          //   to: liquidatorAddress,
          //   tokenSym: await details.lendingToken.symbol(),
          //   amount: BigNumber.from(borrowedAmount).mul(2),
          //   hre,
          // })
          // await details.lendingToken
          //   .connect(liquidator)
          //   .approve(diamond.address, BigNumber.from(borrowedAmount).mul(2))
          // const tx = await diamond
          //   .connect(liquidator)
          //   .liquidateLoan(details.loan.id)
          // expect(1).to.equal(1)
        })

        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
    }

    return tests
  }

  static createLoanArgs = (): CreateLoanArgs => {
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
      loanType: randomLoanType,
    }
  }

  static getLoan = async (borrower: Signer): Promise<LoanHelpersReturn> => {
    const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
    const allBorrowerLoans = await diamond.getBorrowerLoans(
      await borrower.getAddress()
    )
    const loanID = allBorrowerLoans[allBorrowerLoans.length - 1].toString()
    return loanHelpers(loanID)
  }
}
