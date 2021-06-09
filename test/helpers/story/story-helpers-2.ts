/*export const actions = {
  LOAN: {
    TAKE: 'Take out',
    LEND: 'Lend',
    REPAY: 'Repay',
    LIQUIDATE: 'liquidate',
  },
  DAPP: {
    LEND: 'Lend',
    WITHDRAW: 'Withdraw',
    SWAP: 'Swap',
  },
}


*/

import { IntegerType } from 'typechain'
import LoanStoryTestDriver from './drivers/loan-story-test-driver'

export const STORY_ACTIONS = {
  LOAN: { TAKE_OUT: 0, LP_LEND: 1, REPAY: 2, LIQUIDATE: 3, SWAP: 4, LEND: 5 },
  DAPP: { LEND: 0, WITHDRAW: 1, SWAP: 2 },
}

export interface TestScenario {
  domain: string
  actions: TestAction[]
}

export interface TestAction {
  actionType: Number
  args?: object
}
//  {domain:'LOAN', actions:[ { actionName:'CREATE', args:{},}, {actionName:'LIQUIDATE', args:{}}   ] }  ,

export const generateTests = (scenario: TestScenario): Array<Test> => {
  switch (scenario.domain) {
    case 'LOAN':
      return LoanStoryTestDriver.generateDomainSpecificTestsForScenario(
        scenario
      )
      break

    default:
      return []
      break
  }
}

const runActions = async (args: TestAction) => {
  switch (args.actionName) {
    case value:
      break

    default:
      break
  }
}
