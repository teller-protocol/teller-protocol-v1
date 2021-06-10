import Chai from 'chai'

import Mocha from 'mocha'
import { Signer, BigNumber } from 'ethers'
import moment from 'moment'

import { Test } from 'mocha'
import { TestScenario, STORY_ACTIONS, TestAction } from '../story-helpers'
import StoryTestDriver from './story-test-driver'

import hre, { contracts, getNamedSigner } from 'hardhat'

import { getPlatformSetting, updatePlatformSetting } from '../../../../tasks'
import { ITellerDiamond } from '../../../../types/typechain'
import { getMarkets } from '../../../../config'
import { getFunds } from '../../get-funds'
import {
  LPHelperArgs,
  depositWithArgs,
  withdrawWithArgs,
} from '../../lending-pool'
import LoanStoryTestDriver from './loan-story-test-driver'
var expect = Chai.expect
/*
We will read state data from the chaindata to determine whether or not each 'action' should pass or fail at the current moment 
Then we will expect that 
*/

export default class LPStoryTestDriver extends StoryTestDriver {
  static generateDomainSpecificTestsForScenario(
    scenario: TestScenario
  ): Array<Test> {
    let allTests: Array<Test> = []

    let scenarioActions = scenario.actions

    for (let action of scenarioActions) {
      let testsForAction: Array<Test> =
        LPStoryTestDriver.generateTestsForAction(action)

      allTests = allTests.concat(testsForAction)
    }

    return allTests
  }

  static generateTestsForAction(action: TestAction): Array<Test> {
    let tests: Array<Test> = []

    let actionType = action.actionType
    // let arguments:?object = action.args

    switch (actionType) {
      case STORY_ACTIONS.LENDING_POOL.LEND: {
        let newTest = new Test('Lend to loan', async function () {
          // const lpArgs: LPHelperArgs = await LPStoryTestDriver.createLPArgs()
          // await depositWithArgs(lpArgs)
          expect(1).to.equal(1)
        })

        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
      case STORY_ACTIONS.LENDING_POOL.WITHDRAW: {
        let newTest = new Test('Lend to loan', async function () {
          // const lpArgs: LPHelperArgs = await LPStoryTestDriver.createLPArgs()
          // await withdrawWithArgs(lpArgs)
          expect(1).to.equal(1)
        })
        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
    }

    return tests
  }

  static createLPArgs = async (): Promise<LPHelperArgs> => {
    const borrower = await getNamedSigner('borrower')
    const loan = await LoanStoryTestDriver.getLoan(borrower)
    const { details, diamond } = loan
    const tToken = await hre.contracts.get('ITToken', {
      at: await diamond.getTTokenFor(details.lendingToken.address),
    })

    const lpHelperArgs: LPHelperArgs = {
      diamond: diamond,
      lendingToken: details.lendingToken,
      tToken: tToken,
    }
    return lpHelperArgs
  }
}
