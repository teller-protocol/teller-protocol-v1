import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { BigNumber } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Test } from 'mocha'

import { getMarkets } from '../../../../config'
import { ITToken } from '../../../../types/typechain'
import { fundedMarket } from '../../../fixtures'
import { fundLender, getFunds } from '../../get-funds'
import { getLPHelpers } from '../../lending-pool'
import {
  LoanSnapshots,
  STORY_DOMAINS,
  TestAction,
  TestScenario,
} from '../story-helpers'
import LoanStoryTestDriver from './loan-story-test-driver'
import StoryTestDriver from './story-test-driver'
chai.should()
chai.use(solidity)
/*
We will read state data from the chaindata to determine whether or not each 'action' should pass or fail at the current moment
Then we will expect that
*/

export default class LPStoryTestDriver extends StoryTestDriver {
  static generateDomainSpecificTestsForScenario(
    hre: HardhatRuntimeEnvironment,
    scenario: TestScenario,
    parentSuite: Mocha.Suite
  ): Mocha.Suite {
    const scenarioActions = scenario.actions

    for (const action of scenarioActions) {
      const testsForAction: Test[] = LPStoryTestDriver.generateTestsForAction(
        hre,
        action,
        parentSuite
      )

      //allTests = allTests.concat(testsForAction)

      for (const test of testsForAction) {
        parentSuite.addTest(test)
      }
    }

    return parentSuite
  }

  static generateTestsForAction(
    hre: HardhatRuntimeEnvironment,
    action: TestAction,
    testSuite: Mocha.Suite
  ): Test[] {
    const tests: Test[] = []

    const { actionType, args } = action

    switch (actionType) {
      case 'LEND': {
        const newTest = new Test(action.suiteName, async () => {
          const helpers: ReturnType<typeof getLPHelpers> =
            await LPStoryTestDriver.createLPArgs(hre)

          const shouldPass = true
          //read the state and determine if this should pass

          if (shouldPass) {
            // expect(await depositWithArgs(hre, lpArgs)).to.not.throw()
            const deposit = await helpers.deposit()
          } else {
            await helpers.deposit().catch((error) => {
              expect(error).to.exist
            })
          }
        })

        tests.push(newTest)
        break
      }
      case 'WITHDRAW': {
        const newTest = new Test(action.suiteName, async () => {
          const helpers: ReturnType<typeof getLPHelpers> =
            await LPStoryTestDriver.createLPArgs(hre)

          const shouldPass = true
          //read the state and determine if this should pass
          // if()

          if (shouldPass) {
            await helpers.withdraw()
          } else {
            await helpers.withdraw().catch((error) => {
              expect(error).to.exist
            })
          }
        })
        tests.push(newTest)
        break
      }
    }
    return tests
  }

  static createLPArgs = async (
    hre: HardhatRuntimeEnvironment
  ): Promise<ReturnType<typeof getLPHelpers>> => {
    const { getNamedSigner, contracts } = hre
    const borrower = await getNamedSigner('borrower')
    const loan = await LoanStoryTestDriver.getLoan(hre, borrower)
    const { details, diamond } = loan
    const tToken: ITToken = await contracts.get('ITToken', {
      at: await diamond.getTTokenFor(details.lendingToken.address),
    })
    // const maxTVL = await diamond.getAssetMaxTVL(details.lendingToken.address)
    // const depositAmount = maxTVL
    console.log({
      lent: details.loan.borrowedAmount.toString(),
      bal: (
        await details.lendingToken.balanceOf(await borrower.getAddress())
      ).toString(),
      token: await details.lendingToken.symbol(),
    })
    await fundLender({
      token: details.lendingToken,
      amount: BigNumber.from(100),
      hre,
    })
    const helpers = getLPHelpers(hre, {
      diamond,
      lendingToken: details.lendingToken,
      tToken,
      amount: null,
    })
    return helpers
  }
}
