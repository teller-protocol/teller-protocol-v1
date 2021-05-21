import { subtask, task, types } from 'hardhat/config'

interface TestForkArgs {
  chain: string
}
task<TestForkArgs>('test', async (args, hre, runSuper): Promise<void> => {
  const { run } = hre
  const { chain } = args

  await run('fork', { chain, onlyDeployments: true })
  await runSuper({ ...args })
}).addOptionalParam(
  'chain',
  'An ETH network name to fork',
  'mainnet',
  types.string
)
