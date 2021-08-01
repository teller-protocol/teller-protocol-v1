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
  process.env.DISABLE_LOGS = 'true'

  // Run the actual test task
  await runSuper({
    ...args,
  })
})

function createStoryTests(
  mochaInstance: Mocha,
  hre: HardhatRuntimeEnvironment
): number {
  //custom code
  const storyMochaInstance: Mocha = generateAllStoryTests(mochaInstance, hre)

  // console.log('\n\n\n\n')

  //console.log('Completed story tests.')

  return 0
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
    //run the gas reporter plugin
    await runSuper({ testFiles })

    const mocha = new Mocha(hre.config.mocha)

    await createStoryTests(mocha, hre) //adds them to mocha as suite

    //testFiles.forEach((file) => mocha.addFile(file))
    const testFailures = await new Promise((resolve, _) => {
      mocha.run(resolve)
    })
    return testFailures
  }
)
