/*
Use procedural generation and deterministic random number generation to build the array 


*/
/*


const testScenarios = [
  {
    domain: 'LOAN',
    actions: [
      { actionType: STORY_ACTIONS.LOAN.TAKE_OUT, args: {} },
      { actionName: STORY_ACTIONS.LOAN.LIQUIDATE, args: {} },
    ],
  },
  {
    domain: 'LOAN',
    actions: [
      { actionType: STORY_ACTIONS.LOAN.TAKE_OUT, args: {} },
      { actionName: STORY_ACTIONS.LOAN.REPAY, args: {} },
    ],
  },
]

*/

import { STORY_ACTIONS, TestScenario } from '../story-helpers-2'

export const generateStories = (): Array<TestScenario> => {
  let manualScenarios = [
    {
      domain: 'LOAN',
      actions: [
        { actionType: STORY_ACTIONS.LOAN.TAKE_OUT, args: {} },
        { actionType: STORY_ACTIONS.LOAN.LIQUIDATE, args: {} },
      ],
    },
    {
      domain: 'LOAN',
      actions: [
        { actionType: STORY_ACTIONS.LOAN.TAKE_OUT, args: {} },
        { actionType: STORY_ACTIONS.LOAN.REPAY, args: {} },
      ],
    },
  ]

  return manualScenarios
}
