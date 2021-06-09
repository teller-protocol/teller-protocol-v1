import LoanStoryTestDriver from './drivers/loan-story-test-driver'
import { suite } from './test-config'

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

// export interface LoanArgs {
//   type: string
//   amount: BigNumber
//   from: Signer
//   nft: boolean
//   collateral: CollateralFunctions
//   diamond: ITellerDiamond
//   details: LoanDetailsReturn
// }
//  {domain:'LOAN', actions:[ { actionName:'CREATE', args:{},}, {actionName:'LIQUIDATE', args:{}}   ] }  ,
// import { expect } from 'chai'
// const reportValue = require('mochawesome/addContext')

export const generateTests = (scenario: TestScenario): Array<any> => {
  const parentSuiteName = suite('Story Suite')
  switch (scenario.domain) {
    case 'LOAN':
      return LoanStoryTestDriver.generateDomainSpecificTestsForScenario(
        scenario,
        parentSuiteName
      )
      break
    default:
      return []
      break
  }
}
/*
const runActions = async (args: TestAction) => {
  switch (args.actionName) {
    case value:
      break

    default:
      break
  }
}*/
