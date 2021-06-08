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

export const generateTests = async (args: object) => {}
