/*
Use procedural generation and deterministic random number generation to build the array 


*/

import { STORY_ACTIONS, TestScenario } from '../story-helpers-2'

export const generateStories = (): Array<TestScenario> => {
  return [
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
}
