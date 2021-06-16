import {
  STORY_ACTIONS,
  DAPP_ACTIONS,
  TestScenario,
  TestAction,
} from '../story-helpers'

export const generateStories = (): Array<TestScenario> => {
  const domains: string[] = Object.keys(STORY_ACTIONS)
  const proceduralScenarios = domains.map((domain) => {
    const actions: TestAction[] = []
    switch (domain) {
      case 'DAPP':
        const dappActionTypes: [string, number][] = Object.entries(
          STORY_ACTIONS[domain]
        )
        dappActionTypes.map((dappActionType) => {
          const dappTypes: [string, number][] = Object.entries(
            DAPP_ACTIONS[dappActionType[0]]
          )
          dappTypes.map((dappType) => {
            let trueTest: TestAction = {
              actionType: dappActionType[1],
              suiteName: `${dappType[0]} true test`,
              args: {
                pass: true,
                parent: dappType[1] == 0 ? null : dappType[1],
                dapp: dappType[1],
              },
            }
            let falseTest: TestAction = {
              actionType: dappActionType[1],
              suiteName: `${dappType[0]} false test`,
              args: { pass: false, parent: null, dapp: dappType[1] },
            }
            actions.push(trueTest, falseTest)
          })
        })
        break
      default:
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
        break
    }
    return { domain, actions }
  })

  return proceduralScenarios
}
