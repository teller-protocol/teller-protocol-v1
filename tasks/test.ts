import fs from 'fs'
import { TASK_TEST_RUN_MOCHA_TESTS } from 'hardhat/builtin-tasks/task-names'
import { task } from 'hardhat/config'
import { subtask } from 'hardhat/config'
import {
  BackwardsCompatibilityProviderAdapter
} from "hardhat/internal/core/providers/backwards-compatibility"
import { glob } from 'hardhat/internal/util/glob'
import { HARDHAT_NETWORK_NAME } from 'hardhat/plugins'
import { Artifacts, HardhatRuntimeEnvironment, HttpNetworkConfig } from 'hardhat/types'
import { EthGasReporterConfig, RemoteContract } from "hardhat-gas-reporter/src/types"
import Mocha from 'mocha'
import path from 'path'
import sha1 from "sha1"

import { generateAllStoryTests } from '../test/integration/story-test-manager'
import {
  EGRAsyncApiProvider,
  EGRDataCollectionProvider} from "./test-helper"

 
  task('test').setAction(async (args, hre, runSuper) => {
    const { run } = hre
  
    const chain = process.env.FORKING_NETWORK
    if (chain == null) {
      throw new Error(`Invalid network to fork and run tests on: ${chain}`)
    }
  
    // Fork the deployment files into the 'hardhat' network
    await run('fork', {
      chain,
      onlyDeployment: false,
    })
  
    // Disable logging
    process.env.DISABLE_LOGS = 'true'
  
    // Run the actual test task
    await runSuper({
      ...args,
      deployFixture: true,
    })
  })