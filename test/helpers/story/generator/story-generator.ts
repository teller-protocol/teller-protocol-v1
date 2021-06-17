import {
  STORY_DOMAINS,
  DAPP_ACTION_TARGETS,
  TestScenario,
  TestAction,
} from '../story-helpers'

export const generateStories = (): Array<TestScenario> => {
  const domains: string[] = Object.keys(STORY_DOMAINS)

  /*

  let manualScenarios: TestScenario[] = [
    {
      domain: 'LOAN',
      actions: [
        {
          actionType: STORY_DOMAINS.LOAN.TAKE_OUT,
          suiteName: '',
          args: { shouldPass: true, rewindStateTo: null },
        },
        {
          actionType: STORY_DOMAINS.LOAN.LIQUIDATE,
          suiteName: '',
          args: { shouldPass: true, rewindStateTo: STORY_DOMAINS.LOAN.TAKE_OUT },
        },
        {
          actionType: STORY_DOMAINS.LOAN.REPAY,
          suiteName: '',
          args: { shouldPass: true, rewindStateTo: STORY_DOMAINS.LOAN.TAKE_OUT },
        },
      ],
    },
    {
      domain: 'LOAN',
      actions: [
        {
          actionType: STORY_DOMAINS.LOAN.TAKE_OUT,
          suiteName: '',
          args: { shouldPass: true, rewindStateTo: null },
        },
        {
          actionType: STORY_DOMAINS.LOAN.LIQUIDATE,
          suiteName: '',
          args: { shouldPass: true, rewindStateTo: STORY_DOMAINS.LOAN.TAKE_OUT },
        },
        {
          actionType: STORY_DOMAINS.LOAN.REPAY,
          suiteName: '',
          args: { shouldPass: true, rewindStateTo: STORY_DOMAINS.LOAN.TAKE_OUT },
        },
      ],
    },


    {
      domain: 'LENDING_POOL',
      actions: [
        {
          actionType: STORY_DOMAINS.LENDING_POOL.LEND,
          suiteName: '',
          args: { shouldPass: true, rewindStateTo: null },
        },
        {
          actionType: STORY_DOMAINS.LENDING_POOL.WITHDRAW,
          suiteName: '',
          args: { shouldPass: true, rewindStateTo: STORY_DOMAINS.LENDING_POOL.LEND },
        },
      ],
    },
    {
      domain: 'DAPP',
      actions: [
        {
          actionType: STORY_DOMAINS.DAPP.LEND,
          suiteName: '',
          args: { shouldPass: true, rewindStateTo: STORY_DOMAINS.LOAN.TAKE_OUT, actionTarget: DAPP_ACTION_TARGETS.SWAP.UNISWAP },
        },
        {
          actionType: STORY_DOMAINS.DAPP.SWAP,
          suiteName: '',
          args: { shouldPass: true, rewindStateTo: STORY_DOMAINS.LOAN.TAKE_OUT, actionTarget: DAPP_ACTION_TARGETS.SWAP.SUSHISWAP },
        },
      ],
     },
  ]*/

  const proceduralScenarios = domains.map((domain) => {
    const actions: TestAction[] = []
    switch (domain) {
      case 'DAPP':
        /*const storyActionTypes: [string, number][] = Object.entries(
          STORY_DOMAINS[domain]
        )*/
        const storyActionTypeKeys: string[] = Object.keys(STORY_DOMAINS[domain])

        storyActionTypeKeys.map((storyActionTypeKey) => {
          console.log(' storyActionTypeKey ', storyActionTypeKey)

          console.log(' STORY_DOMAINS[domain] ', STORY_DOMAINS[domain])

          let storyActionType: number =
            STORY_DOMAINS[domain][storyActionTypeKey] //[storyActionTypeKey]

          const dappTypes: [string, number][] = Object.entries(
            DAPP_ACTION_TARGETS[storyActionTypeKey]
          )

          /* const dappTypes:  string[]  = Object.values(
            DAPP_ACTION_TARGETS[storyActionType]
          )*/

          console.log('story gen dappTypes', dappTypes)

          dappTypes.map((dappType) => {
            const dappTypeName = dappType[0]
            const dappTypeIndex = dappType[1]

            let trueTest: TestAction = {
              actionType: storyActionType,
              suiteName: `${dappTypeName} true test`,
              args: {
                //  shouldPass: true,
                rewindStateTo: dappTypeIndex == 0 ? null : dappTypeIndex,
                actionTarget: dappTypeIndex,
              },
            }
            let falseTest: TestAction = {
              actionType: storyActionType,
              suiteName: `${dappTypeName} false test`,
              args: {
                //   shouldPass: false,
                rewindStateTo: null,
                actionTarget: dappTypeIndex,
              },
            }

            actions.push(trueTest, falseTest)
          })
        })
        break

      default:
        const actionTypes: [string, number][] = Object.entries(
          STORY_DOMAINS[domain]
        )
        actionTypes.map((actionType) => {
          let trueTest: TestAction = {
            actionType: actionType[1],
            suiteName: `${actionType[0]} true test`,
            args: {
              // shouldPass: true,
              rewindStateTo: actionType[1] == 0 ? null : actionType[1],
            },
          }
          let falseTest: TestAction = {
            actionType: actionType[1],
            suiteName: `${actionType[0]} false test`,
            args: { shouldPass: false, rewindStateTo: null },
          }
          actions.push(trueTest, falseTest)
        })
        break
    }
    return { domain, actions }
  })

  return proceduralScenarios
}
