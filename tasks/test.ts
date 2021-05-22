import { TASK_TEST_RUN_MOCHA_TESTS } from 'hardhat/builtin-tasks/task-names'
import { subtask, task, types } from 'hardhat/config'
import { ActionType } from 'hardhat/types'

interface TestForkArgs {
  chain: string
}

const testTask: ActionType<TestForkArgs> = async (
  args,
  hre,
  runSuper
): Promise<void> => {
  const { run } = hre
  const { chain } = args

  await run('fork', { chain, onlyDeployments: true })
  await runSuper({ ...args })
}

task<TestForkArgs>('test', testTask).addOptionalParam(
  'chain',
  'An ETH network name to fork',
  'mainnet',
  types.string
)

subtask(TASK_TEST_RUN_MOCHA_TESTS).setAction(async (args, hre, runSuper) => {
  await hre.run('fork:fund-deployer')
  await runSuper(args)
})
