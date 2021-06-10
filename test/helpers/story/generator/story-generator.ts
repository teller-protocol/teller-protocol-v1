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

import { STORY_ACTIONS, TestScenario } from '../story-helpers'

export const generateStories = (): Array<TestScenario> => {
  let manualScenarios: TestScenario[] = [
    {
      domain: 'LOAN',
      actions: [
        {
          actionType: STORY_ACTIONS.LOAN.TAKE_OUT,
          suiteName: '',
          args: { pass: true, parent: null },
        },
        {
          actionType: STORY_ACTIONS.LOAN.LIQUIDATE,
          suiteName: '',
          args: { pass: true, parent: STORY_ACTIONS.LOAN.TAKE_OUT },
        },
        // {
        //   actionType: STORY_ACTIONS.LOAN.REPAY,
        //   suiteName: '',
        //   args: { pass: true, parent: STORY_ACTIONS.LOAN.TAKE_OUT },
        // },
      ],
    },
    // {
    //   domain: 'LOAN',
    //   actions: [
    //     { actionType: STORY_ACTIONS.LOAN.TAKE_OUT, suiteName: '', args: {pass: true, parent: null} },
    //     { actionType: STORY_ACTIONS.LOAN.REPAY, suiteName: '', args: {pass: true, parent: STORY_ACTIONS.LOAN.TAKE_OUT} },
    //   ],
    // },
  ]

  return manualScenarios
}
