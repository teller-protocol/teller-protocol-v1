import { TASK_TEST_RUN_MOCHA_TESTS } from 'hardhat/builtin-tasks/task-names'
import { task } from 'hardhat/config'
import { subtask } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import Mocha from 'mocha'

import { generateAllStoryTests } from '../test/integration/story-test-manager'

task('test').setAction(async (args, hre, runSuper) => {
  const { run } = hre

  const chain = process.env.FORKING_NETWORK

  if (chain == null) {
    throw new Error(`Invalid network to fork and run tests on: ${chain}`)
  }

  // Fork the deployment files into the 'hardhat' network
  await run('fork', {
    chain,
    onlyDeployment: true,
  })

  // Disable logging
  //  process.env.DISABLE_LOGS = 'true'

  // Run the actual test task
  await runSuper({
    ...args,
  })
})

const runStoryTests = async (
  hre: HardhatRuntimeEnvironment
): Promise<number> => {
  // Create new mocha instance
  const mocha = new Mocha(hre.config.mocha)

  generateAllStoryTests(mocha, hre)

  return await new Promise<number>((resolve, _) => {
    mocha.run(resolve)
  })
}

// https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-core/src/builtin-tasks/test.ts
// https://github.com/cgewecke/hardhat-gas-reporter/blob/master/src/index.ts

/**
 * Overrides TASK_TEST_RUN_MOCHA_TEST to (conditionally) use eth-gas-reporter as
 * the mocha test reporter and passes mocha relevant options. These are listed
 * on the `gasReporter` of the user's config.
 */

subtask(TASK_TEST_RUN_MOCHA_TESTS).setAction(
  async ({ testFiles }: { testFiles: string[] }, hre, runSuper) => {
    let failures = 0
    failures += (await runSuper({ testFiles })) as number
    failures += await runStoryTests(hre)
    return failures
  }
)
