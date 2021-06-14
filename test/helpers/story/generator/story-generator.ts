import { STORY_ACTIONS, TestScenario } from '../story-helpers'

export const generateStories = (): Array<TestScenario> => {
  let testScenarios: TestScenario[]
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

  const domains: number = Object.keys(STORY_ACTIONS).length
  // const testScenario: TestScenario = {}

  // domains.map((domain) => {
  //   console.log({domain})
  //   // const testScenario: TestScenario = { domain }
  //   const actions = Object.values(STORY_ACTIONS['LOAN']).length
  // })

  return manualScenarios
}
