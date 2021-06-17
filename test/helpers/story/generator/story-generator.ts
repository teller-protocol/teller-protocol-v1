import {
  STORY_DOMAINS,
  DAPP_ACTION_TARGETS,
  TestScenario,
  TestAction,
} from '../story-helpers'

export const generateStories = (): Array<TestScenario> => {
  const domains: string[] = Object.keys(STORY_DOMAINS)
  const proceduralScenarios = domains.map((domain) => {
    const actions: TestAction[] = []
    switch (domain) {
      case 'DAPP':
        const storyActionTypeKeys: string[] = Object.keys(STORY_DOMAINS[domain])

        storyActionTypeKeys.map((storyActionTypeKey) => {
          console.log(' storyActionTypeKey ', storyActionTypeKey)

          console.log(' STORY_DOMAINS[domain] ', STORY_DOMAINS[domain])

          let storyActionType: number =
            STORY_DOMAINS[domain][storyActionTypeKey] //[storyActionTypeKey]

          const dappTypes: [string, number][] = Object.entries(
            DAPP_ACTION_TARGETS[storyActionTypeKey]
          )

          console.log('story gen dappTypes', dappTypes)

          dappTypes.map((dappType) => {
            const dappTypeName = dappType[0]
            const dappTypeIndex = dappType[1]

            let test: TestAction = {
              actionType: storyActionType,
              suiteName: `${dappTypeName} true test`,
              args: {
                //  shouldPass: true,
                rewindStateTo: dappTypeIndex == 0 ? null : dappTypeIndex,
                actionTarget: dappTypeIndex,
              },
            }

            actions.push(test)
          })
        })
        break
      default:
        const actionTypes: [string, number][] = Object.entries(
          STORY_DOMAINS[domain]
        )
        actionTypes.map((actionType) => {
          let test: TestAction = {
            actionType: actionType[1],
            suiteName: `${actionType[0]} true test`,
            args: {
              // shouldPass: true,
              rewindStateTo: actionType[1] == 0 ? null : 0,
            },
          }
          actions.push(test)
        })
        break
    }
    return { domain, actions }
  })
  console.log('procedural scenes: %o', proceduralScenarios)
  return proceduralScenarios
}
