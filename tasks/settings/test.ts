import { task, types } from 'hardhat/config'
import { ActionType, HardhatRuntimeEnvironment } from 'hardhat/types'

interface TestArgs {
  fork?: string
}
const runTest: ActionType<TestArgs> = async (args, hre, runSuper) => {
  const network = args.fork
  console.log({ network })
  // await hre.run('fork', { chain: network, silent: true })
  await runSuper({ ...args, fork: network })
}
task('test')
  .addOptionalParam('fork', '', 'mainnet', types.string)
  .setAction(runTest)
