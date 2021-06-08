export const actions = {
  LOAN: {
    TAKE: 'Take out',
    LEND: 'Lend',
    REPAY: 'Repay',
    LIQUIDATE: 'liquidate',
  },
  DAPP: {
    LEND: 'Lend',
    WITHDRAW: 'Withdraw',
    SWAP: 'Swap',
  },
}

interface TestScenario {
  domain: string
  actions: TestAction[]
}

interface TestAction {
  actionName: string
  args?: object
}
//  {domain:'LOAN', actions:[ { actionName:'CREATE', args:{},}, {actionName:'LIQUIDATE', args:{}}   ] }  ,

const generateTests = async (args: TestScenario) => {
  switch (args.domain) {
    case value:
      break

    default:
      break
  }
}

const runActions = async (args: TestAction) => {
  switch (args.actionName) {
    case value:
      break

    default:
      break
  }
}
