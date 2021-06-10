import { Test } from 'mocha'
import LoanStoryTestDriver from './drivers/loan-story-test-driver'

export const STORY_ACTIONS = {
  LOAN: { TAKE_OUT: 0, REPAY: 1, LIQUIDATE: 2 },
  LENDING_POOL: { LEND: 0, WITHDRAW: 1 },
  DAPP: { LEND: 0, WITHDRAW: 1, SWAP: 2 },
}

export interface TestScenario {
  domain: string
  actions: TestAction[]
}

export interface TestAction {
  actionType: Number
  args: TestArgs
}

export interface TestArgs {
  dapp?: number
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
