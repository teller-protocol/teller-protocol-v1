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
        {
          actionType: STORY_ACTIONS.LOAN.REPAY,
          suiteName: '',
          args: { pass: true, parent: STORY_ACTIONS.LOAN.TAKE_OUT },
        },
      ],
    },
    {
      domain: 'LENDING_POOL',
      actions: [
        {
          actionType: STORY_ACTIONS.LENDING_POOL.LEND,
          suiteName: '',
          args: { pass: true, parent: null },
        },
        {
          actionType: STORY_ACTIONS.LENDING_POOL.WITHDRAW,
          suiteName: '',
          args: { pass: true, parent: STORY_ACTIONS.LENDING_POOL.LEND },
        },
      ],
    },
    {
      domain: 'DAPP',
      actions: [
        {
          actionType: STORY_ACTIONS.DAPP.LEND,
          suiteName: '',
          args: { pass: true, parent: null, dapp: 1 },
        },
        {
          actionType: STORY_ACTIONS.DAPP.SWAP,
          suiteName: '',
          args: { pass: true, parent: null, dapp: 0 },
        },
      ],
    },
  ]

  return manualScenarios
}
