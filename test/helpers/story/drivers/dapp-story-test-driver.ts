import Chai from 'chai'

import Mocha from 'mocha'
import { Signer, BigNumber } from 'ethers'
import moment from 'moment'

import { Test } from 'mocha'
import { TestScenario, STORY_ACTIONS, TestAction } from '../story-helpers'
import StoryTestDriver from './story-test-driver'

var expect = Chai.expect

export const DAPPS = {
  LEND: { AAVE: 0, COMPOUND: 1, POOL_TOGETHER: 2 },
  SWAP: { UNISWAP: 0, SUSHISWAP: 1 },
}
/*
We will read state data from the chaindata to determine whether or not each 'action' should pass or fail at the current moment 
Then we will expect that 
*/

export default class DappStoryTestDriver extends StoryTestDriver {
  static generateDomainSpecificTestsForScenario(
    scenario: TestScenario
  ): Array<Test> {
    let allTests: Array<Test> = []

    let scenarioActions = scenario.actions

    for (let action of scenarioActions) {
      let testsForAction: Array<Test> =
        DappStoryTestDriver.generateTestsForAction(action)

      allTests = allTests.concat(testsForAction)
    }

    return allTests
  }

  static generateTestsForAction(action: TestAction): Array<Test> {
    let tests: Array<Test> = []

    let actionType = action.actionType
    let args = action.args

    switch (actionType) {
      case STORY_ACTIONS.DAPP.LEND: {
        DappStoryTestDriver.generateTestsForLend(args.dapp, tests)
        break
      }
      case STORY_ACTIONS.DAPP.SWAP: {
        DappStoryTestDriver.generateTestsForSwap(args.dapp, tests)
        break
      }
    }

    return tests
  }

  static generateTestsForLend(dapp: number | undefined, tests: Array<Test>) {
    dapp = dapp ? dapp : 0
    switch (dapp) {
      case DAPPS.LEND.AAVE: {
        let newTest = new Test('AAVE Lend DAPP', async function () {
          expect(1).to.equal(1)
        })
        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
      case DAPPS.LEND.COMPOUND: {
        let newTest = new Test('COMPOUND Lend DAPP', async function () {
          expect(1).to.equal(1)
        })
        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
      case DAPPS.LEND.POOL_TOGETHER: {
        let newTest = new Test('POOL_TOGETHER Lend DAPP', async function () {
          expect(1).to.equal(1)
        })
        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
      default:
        break
    }
  }

  static async generateTestsForSwap(
    dapp: number | undefined,
    tests: Array<Test>
  ) {
    dapp = dapp ? dapp : 0
    switch (dapp) {
      case DAPPS.SWAP.UNISWAP: {
        let newTest = new Test('UNISWAP Swap DAPP', async function () {
          expect(1).to.equal(1)
        })
        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
      case DAPPS.SWAP.SUSHISWAP: {
        let newTest = new Test('SUSHISWAP Swap DAPP', async function () {
          expect(1).to.equal(1)
        })
        console.log('push new story test ! ')
        tests.push(newTest)
        break
      }
      default:
        break
    }
  }
}
