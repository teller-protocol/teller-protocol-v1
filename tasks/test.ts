import { task, types } from 'hardhat/config'
import { subtask } from 'hardhat/config'
import { TASK_TEST_RUN_MOCHA_TESTS } from 'hardhat/builtin-tasks/task-names'
import { HARDHAT_NETWORK_NAME } from 'hardhat/plugins'
import { updatePlatformSetting } from '../tasks'
import { generateAllStoryTests } from '../test/integration/story-test-manager'
import Mocha from 'mocha'

import path from 'path'
import { glob } from 'hardhat/internal/util/glob'

const { EVENT_FILE_PRE_REQUIRE, EVENT_FILE_POST_REQUIRE, EVENT_FILE_REQUIRE } =
  Mocha.Suite.constants

import {
  HardhatArguments,
  HttpNetworkConfig,
  NetworkConfig,
  EthereumProvider,
  HardhatRuntimeEnvironment,
  Artifact,
  Artifacts,
  ActionType,
} from 'hardhat/types'
import { MochaOptions } from 'mocha'

let mochaConfig

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
  // process.env.DISABLE_LOGS = 'true'

  // Run the actual test task
  await runSuper({
    ...args,
    deployFixture: true,
  })
})

//https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-core/src/builtin-tasks/test.ts
/**
 * Overrides TASK_TEST_RUN_MOCHA_TEST to (conditionally) use eth-gas-reporter as
 * the mocha test reporter and passes mocha relevant options. These are listed
 * on the `gasReporter` of the user's config.
 */
/*
 taskArgs: ArgsT,
 env: HardhatRuntimeEnvironment,
 runSuper: RunSuperFunction<ArgsT>*/

subtask(TASK_TEST_RUN_MOCHA_TESTS)
  // let sample:ActionType;
  //{ testFiles }: { testFiles: string[] }, { config }

  .setAction(async ({ testFiles }: { testFiles: string[] }, hre, runSuper) => {
    var mochaInstance = new Mocha()
    mochaInstance.timeout(19000)

    var suiteInstance = Mocha.Suite.create(
      mochaInstance.suite,
      'Story Test Suite'
    )

    //custom code
    const allStoryTests = generateAllStoryTests(hre)

    const tsFiles = await glob(path.join(hre.config.paths.tests, '**/*.ts'))

    let storyTestFiles: string[] = []

    for (let test of allStoryTests) {
      suiteInstance.addTest(test)

      // storyTestFiles.push(  convertMochaTestToFile(test)  )
    }

    console.log('\n\n\n\n')

    const percentageSubmission = {
      name: 'RequiredSubmissionsPercentage',
      value: 0,
    }
    await updatePlatformSetting(percentageSubmission, hre)

    const testFailures = await new Promise<number>((resolve, _) => {
      mochaInstance.run(resolve)
    })

    console.log('\n\n\n\n')

    mochaInstance = new Mocha()
    mochaInstance.timeout(19000)

    tsFiles.forEach(function (file: string) {
      mochaInstance.addFile(file)
    })

    const fileTestFailures = await new Promise<number>((resolve, _) => {
      mochaInstance.run(resolve)
    })

    console.log('Completed all tests.')

    /*if(testFailures > 0){
      return testFailures
    }*/

    return fileTestFailures
  })
