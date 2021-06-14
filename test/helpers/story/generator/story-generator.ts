import {
  STORY_ACTIONS,
  DAPP_ACTIONS,
  TestScenario,
  TestAction,
} from '../story-helpers'

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

  const domains: string[] = Object.keys(STORY_ACTIONS)
  const proceduralScenarios = domains.map((domain) => {
    const actions: TestAction[] = []
    const actionTypes: [string, number][] = Object.entries(
      STORY_ACTIONS[domain]
    )
    actionTypes.map((actionType) => {
      let trueTest: TestAction = {
        actionType: actionType[1],
        suiteName: `${actionType[0]} true test`,
        args: {
          pass: true,
          parent: actionType[1] == 0 ? null : actionType[1],
        },
      }
      let falseTest: TestAction = {
        actionType: actionType[1],
        suiteName: `${actionType[0]} false test`,
        args: { pass: false, parent: null },
      }
      actions.push(trueTest, falseTest)
    })
    return { domain, actions }
  })

  console.log('procedural tests: %o', proceduralScenarios)

  return manualScenarios
}
