import { task, types } from 'hardhat/config'
import { subtask } from 'hardhat/config'
import { TASK_TEST_RUN_MOCHA_TESTS } from 'hardhat/builtin-tasks/task-names'
import { HARDHAT_NETWORK_NAME } from 'hardhat/plugins'

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
    deployFixture: true,
  })
})

/**
 * Merges GasReporter defaults with user's GasReporter config
 * @param  {HardhatRuntimeEnvironment} hre
 * @return {any}
 */
function getOptions(hre: HardhatRuntimeEnvironment): any {
  return { ...getDefaultOptions(hre), ...(hre.config as any).gasReporter }
}

/**
 * Sets reporter options to pass to eth-gas-reporter:
 * > url to connect to client with
 * > artifact format (hardhat)
 * > solc compiler info
 * @param  {HardhatRuntimeEnvironment} hre
 * @return {EthGasReporterConfig}
 */
function getDefaultOptions(
  hre: HardhatRuntimeEnvironment
): EthGasReporterConfig {
  const defaultUrl = 'http://localhost:8545'
  const defaultCompiler = hre.config.solidity.compilers[0]

  let url: any
  // Resolve URL
  if ((<HttpNetworkConfig>hre.network.config).url) {
    url = (<HttpNetworkConfig>hre.network.config).url
  } else {
    url = defaultUrl
  }

  return {
    enabled: true,
    url: <string>url,
    metadata: {
      compiler: {
        version: defaultCompiler.version,
      },
      settings: {
        optimizer: {
          enabled: defaultCompiler.settings.optimizer.enabled,
          runs: defaultCompiler.settings.optimizer.runs,
        },
      },
    },
  }
}

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
      console.log('add test', test)
      suiteInstance.addTest(test)

      // storyTestFiles.push(  convertMochaTestToFile(test)  )
    }

    console.log('\n\n\n\n')

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

/*
 subtask(TASK_TEST_RUN_MOCHA_TESTS)
  
 .setAction(async (args: any, hre, runSuper) => {
 

   const { default: Mocha } = await import("mocha");

  // let mochaOptions:MochaOptions = { cleanReferencesAfterRun: false }

   const mocha = new Mocha(  ); 
   
 
   //testFiles.forEach((file) => mocha.addFile(file));

   const testFailures = await new Promise<number>((resolve, _) => {
    // mocha.run(resolve);
   });

   const allStoryTests = generateAllStoryTests(hre, mocha);
 
    var suiteInstance = Mocha.Suite.create(
      mocha.suite,
      'Story Test Suite'
    )

    for (let test of allStoryTests) {
      suiteInstance.addTest(test)
    }

    const storyTestFailures = await new Promise<number>((resolve, _) => {
      mocha.run(resolve);
    });   

    console.log('story test failures ', storyTestFailures)

    return storyTestFailures
 

   //return runSuper()
 })*/

/*
subtask(TASK_TEST_RUN_MOCHA_TESTS)
  .setAction(async (args: any, hre, runSuper) => {
    const options = getOptions(hre)
    //options.getContracts = getContracts.bind(null, hre.artifacts, options.excludeContracts);

  if (options.enabled) {
      mochaConfig = hre.config.mocha || {};
      mochaConfig.reporter = "eth-gas-reporter";
      mochaConfig.reporterOptions = options;

      if (hre.network.name === HARDHAT_NETWORK_NAME || options.fast){
        const wrappedDataProvider= new EGRDataCollectionProvider(hre.network.provider,mochaConfig);
        hre.network.provider = new BackwardsCompatibilityProviderAdapter(wrappedDataProvider);

        const asyncProvider = new EGRAsyncApiProvider(hre.network.provider);
        resolvedRemoteContracts = await getResolvedRemoteContracts(
          asyncProvider,
          options.remoteContracts
        );

        mochaConfig.reporterOptions.provider = asyncProvider;
        mochaConfig.reporterOptions.blockLimit = (<any>hre.network.config).blockGasLimit as number;
        mochaConfig.attachments = {};
      }

      hre.config.mocha = mochaConfig;
      resolvedQualifiedNames = await hre.artifacts.getAllFullyQualifiedNames();
    }

    console.log('subtask to comandeer mocha tests ')

    console.log( hre.config.mocha )

    return runSuper()
  }
)

*/
