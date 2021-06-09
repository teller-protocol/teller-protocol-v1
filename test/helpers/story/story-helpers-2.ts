import { Test } from 'mocha'
import LoanStoryTestDriver from './drivers/loan-story-test-driver'

export const STORY_ACTIONS = {
  LOAN: { TAKE_OUT: 0, LEND: 1, REPAY: 2, LIQUIDATE: 3 },
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
