import Chai from 'chai'
import Mocha from 'mocha'
// import { Test } from 'mocha'
import { TestScenario, STORY_ACTIONS, TestAction } from '../story-helpers-2'
import StoryTestDriver from './story-test-driver'

import hre, { contracts, ethers } from 'hardhat'
import { getPlatformSetting, updatePlatformSetting } from '../../../../tasks'
import { Test, suiteInstance } from '../test-config'
import { getMarkets } from '../../../../config'
import {
  createLoan,
  LoanType,
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

/*
We will read state data from the chaindata to determine whether or not each 'action' should pass or fail at the current moment 
Then we will expect that 
*/

export default class LoanStoryTestDriver extends StoryTestDriver {
  static generateDomainSpecificTestsForScenario(
    scenario: TestScenario,
    parentSuite: Mocha.Suite
  ): Array<any> {
    // let allTests: Array<Test> = []

    let scenarioActions = scenario.actions
    const testSuite = suiteInstance.create(
      parentSuite,
      `${scenario.domain} tests`
    )

    for (let action of scenarioActions) {
      LoanStoryTestDriver.generateTestsForAction(action, testSuite)
    }

    return []
  }

  static generateTestsForAction(
    action: TestAction,
    testSuite: Mocha.Suite
  ): Array<any> {
    // let tests: Array<Test> = []

    let actionType = action.actionType
    // let arguments:?object = action.args

    switch (actionType) {
      case STORY_ACTIONS.LOAN.TAKE_OUT: {
        testSuite.addTest(
          new Test('take out a loan', async function () {
            //Two of these tests get created and are executed by the Mocha Suite
            // One of them passes and the next one fails - maybe this is because I am not rewinding HRE state properly or something
            await updatePlatformSetting(
              {
                name: 'RequiredSubmissionsPercentage',
                value: 100,
              },
              hre
            )

            // await updatePlatformSetting(
            //   {
            //     name: 'RequiredSubmissionsPercentage',
            //     value: 0,
            //   },
            //   hre
            // )

            // Advance time
            const { value: rateLimit } = await getPlatformSetting(
              'RequestLoanTermsRateLimit',
              hre
            )
            await hre.evm.advanceTime(rateLimit)

            const createArgs = LoanStoryTestDriver.createLoanArgs()

            /*const { tx, getHelpers } = args.nft
                   ? await takeOutLoanWithNfts(createArgs)
                   : await takeOutLoanWithoutNfts(createArgs)*/

            expect(1).to.equal(1)
          })
        )
        console.log('push new story test ! ')
        // tests.push(newTest)
        break
      } //STORY_ACTIONS.LOAN.TAKE_OUT
    }

    return []
  }

  static createLoanArgs = (): CreateLoanArgs => {
    const { network } = hre
    const markets = getMarkets(network)
    const randomMarket = rng.nextInt(0, markets.length - 1)
    const market = markets[randomMarket]
    console.log({ markets })
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
}
