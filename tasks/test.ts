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


let mochaConfig
let resolvedQualifiedNames: string[]



let resolvedRemoteContracts: RemoteContract[] = []



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
    deployFixture: true,
  })
})




// Load remote contract address and ABI data  


function findRemoteContracts(  ): RemoteContract[] {

  const remoteContracts:RemoteContract[] = []
  
  const preCompilesPath = 'deployments/hardhat'
  for (const fileName of fs.readdirSync(preCompilesPath)){
    const artifactPath = path.join(process.cwd(), preCompilesPath, fileName) 
     
    if(fileName.startsWith('.') || !fileName.endsWith('.json'))continue

    try{ 

    const preDeployed =  JSON.parse( fs.readFileSync(artifactPath, 'utf8' ) )
     
    if (preDeployed.address){
      remoteContracts.push({
        name: preDeployed.artifactName,
        abi: preDeployed.abi,
        address: preDeployed.address
      })
    } 

    }catch(e){
      console.error('Could not parse artifact file: ',e)
    }

  //console.log('preDeployed',preDeployed.artifactName)

  }
return remoteContracts
}








async function runStoryTests( { testFiles }: { testFiles: string[] }, hre:HardhatRuntimeEnvironment ): Promise<number> {
  
  let mochaInstance = new Mocha(hre.config.mocha)
  mochaInstance.timeout(19000)

  //custom code
  const storyMochaInstance: Mocha = generateAllStoryTests(mochaInstance, hre)

  console.log('\n\n\n\n')

  const testFailures = await new Promise<number>((resolve, _) => {
    storyMochaInstance.run(resolve)
  })

  console.log('\n\n\n\n')
  const tsFiles = await glob(path.join(hre.config.paths.tests, '**/*.ts'))

  mochaInstance = new Mocha()
  mochaInstance.timeout(19000)

  tsFiles.forEach((file: string) => {
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
}
 

/**
 * Sets reporter options to pass to eth-gas-reporter:
 * > url to connect to client with
 * > artifact format (hardhat)
 * > solc compiler info
 * @param  {HardhatRuntimeEnvironment} hre
 * @return {EthGasReporterConfig}
 */
function getDefaultOptions(hre: HardhatRuntimeEnvironment): EthGasReporterConfig {
  const defaultUrl = "http://localhost:8545"
  const defaultCompiler = hre.config.solidity.compilers[0]

  let url: any
  // Resolve URL
  if ((hre.network.config as HttpNetworkConfig).url) {
    url = (hre.network.config as HttpNetworkConfig).url
  } else {
    url = defaultUrl
  }

  return {
    enabled: true,
    url: url as string,
    metadata: {
      compiler: {
        version: defaultCompiler.version
      },
      settings: {
        optimizer: {
          enabled: defaultCompiler.settings.optimizer.enabled,
          runs: defaultCompiler.settings.optimizer.runs
        }
      }
    }
  }
}




/**
 * Filters out contracts to exclude from report
 * @param  {string}   qualifiedName HRE artifact identifier
 * @param  {string[]} skippable      excludeContracts option values
 * @return {boolean}
 */
 function shouldSkipContract(qualifiedName: string, skippable: string[]): boolean {
  for (const item of skippable){
    if (qualifiedName.includes(item)) return true
  }
  return false
}


/**
 * Method passed to eth-gas-reporter to resolve artifact resources. Loads
 * and processes JSON artifacts
 * @param  {HardhatRuntimeEnvironment} hre.artifacts
 * @param  {String[]}                  skippable    contract *not* to track
 * @return {object[]}                  objects w/ abi and bytecode
 */
 function getContracts(artifacts: Artifacts, skippable: string[] = []) : any[] {
  const contracts = []

  for (const qualifiedName of resolvedQualifiedNames) {

    
    if (shouldSkipContract(qualifiedName, skippable)){
      continue
    }

    let name: string
    let artifact = artifacts.readArtifactSync(qualifiedName)

    // Prefer simple names
    try {
      artifact = artifacts.readArtifactSync(artifact.contractName)
      name = artifact.contractName
    } catch (e) {
      name = qualifiedName
    }

    contracts.push({
      name: name,
      artifact: {
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        deployedBytecode: artifact.deployedBytecode
      }
    })
  }

  for (const remoteContract of resolvedRemoteContracts){

    //console.log('remoteContract ', remoteContract)

    contracts.push({
      name: remoteContract.name,
      artifact: {
        abi: remoteContract.abi,
        bytecode: remoteContract.bytecode,
        bytecodeHash: remoteContract.bytecodeHash,
        deployedBytecode: remoteContract.deployedBytecode
      }
    })
  }
  return contracts
}




 /**
 * Merges GasReporter defaults with user's GasReporter config
 * @param  {HardhatRuntimeEnvironment} hre
 * @return {any}
 */
function getOptions(hre: HardhatRuntimeEnvironment): any {
  return { ...getDefaultOptions(hre), ...(hre.config as any).gasReporter }
}


/**
 * Fetches remote bytecode at address and hashes it so these addresses can be
 * added to the tracking at eth-gas-reporter synchronously on init.
 * @param  {EGRAsyncApiProvider}   provider
 * @param  {RemoteContract[] = []} remoteContracts
 * @return {Promise<RemoteContract[]>}
 */
 async function getResolvedRemoteContracts(
  provider: EGRAsyncApiProvider,
  remoteContracts: RemoteContract[] = []
) : Promise <RemoteContract[]> {
  for (const contract of remoteContracts){
    let code
    try {
      contract.bytecode = await provider.getCode(contract.address)
      contract.deployedBytecode = contract.bytecode
      contract.bytecodeHash = sha1(contract.bytecode)
    } catch (error){
      console.log(`Warning: failed to fetch bytecode for remote contract: ${contract.name}`)
      console.log(`Error was: ${error}\n`)
    }
  }
  return remoteContracts
}


// https://github.com/cgewecke/hardhat-gas-reporter/blob/master/src/index.ts

/**
 * Overrides TASK_TEST_RUN_MOCHA_TEST to (conditionally) use eth-gas-reporter as
 * the mocha test reporter and passes mocha relevant options. These are listed
 * on the `gasReporter` of the user's config.
 */
 subtask(TASK_TEST_RUN_MOCHA_TESTS).setAction(
  async (args: any, hre, runSuper) => {
    const options = getOptions(hre)
    options.getContracts = getContracts.bind(null, hre.artifacts, options.excludeContracts)
    options.remoteContracts = findRemoteContracts()

     
    if (options.enabled) {
      mochaConfig = hre.config.mocha || {}
      mochaConfig.reporter = "eth-gas-reporter"
      mochaConfig.reporterOptions = options

      if (hre.network.name === HARDHAT_NETWORK_NAME || options.fast){

        

        

        const wrappedDataProvider= new EGRDataCollectionProvider(hre.network.provider,mochaConfig)
        hre.network.provider = new BackwardsCompatibilityProviderAdapter(wrappedDataProvider)

        const asyncProvider = new EGRAsyncApiProvider(hre.network.provider)
        resolvedRemoteContracts = await getResolvedRemoteContracts(
          asyncProvider,
          options.remoteContracts 
        )  

        console.log('resolvedRemoteContracts found: ', resolvedRemoteContracts.length  )

        mochaConfig.reporterOptions.provider = asyncProvider
        mochaConfig.reporterOptions.blockLimit = (hre.network.config as any).blockGasLimit as number
    ///    mochaConfig.attachments = {};
      }

      hre.config.mocha = mochaConfig
      resolvedQualifiedNames = await hre.artifacts.getAllFullyQualifiedNames()

     // console.log('resolvedQualifiedNames', resolvedQualifiedNames)
    }


 
    const testFiles: string[] = []

    return await runStoryTests({testFiles},hre)
  }
)



// https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-core/src/builtin-tasks/test.ts
/**
 * Overrides TASK_TEST_RUN_MOCHA_TEST to (conditionally) use eth-gas-reporter as
 * the mocha test reporter and passes mocha relevant options. These are listed
 * on the `gasReporter` of the user's config.
 */
/*
 taskArgs: ArgsT,
 env: HardhatRuntimeEnvironment,
 runSuper: RunSuperFunction<ArgsT>*/

/*
subtask(TASK_TEST_RUN_MOCHA_TESTS).setAction(
  async ({}: { testFiles: string[] }, hre) => {
    //custom code
    const storyMochaInstance: Mocha = generateAllStoryTests(hre)

    console.log('\n\n\n\n')

    await new Promise<number>((resolve, _) => {
      storyMochaInstance.run(resolve)
    })

    console.log('\n\n\n\n')
    const tsFiles = await glob(path.join(hre.config.paths.tests, '**\/*.ts'))

    const mochaInstance = new Mocha()
    mochaInstance.timeout(30000)

    tsFiles.forEach((file: string) => {
      mochaInstance.addFile(file)
    })

    const fileTestFailures = await new Promise<number>((resolve, _) => {
      mochaInstance.run(resolve)
    })

    console.log('Completed all tests.')
 

    return fileTestFailures
  } 
)*/