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

 /*
  const origRun = Mocha.prototype.run

        Mocha.prototype.run =    function(resolve?: (failures:number) => void) : Mocha.Runner {
          // add our suite tests
         // this.addSuite(...)

         console.log('we overloaded the prototype')

           runStoryTests(this,require('hardhat'))
 
          return origRun.call(this, resolve)
        }*/


let mochaConfig
let resolvedQualifiedNames: string[]
const resolvedRemoteContracts: RemoteContract[] = []

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
     deployFixture: false,
    })
  })


    function runStoryTests( mochaInstance: Mocha,  hre:HardhatRuntimeEnvironment ):  number {
   
  
    //custom code
    const storyMochaInstance: Mocha = generateAllStoryTests(mochaInstance, hre)
  
    console.log('\n\n\n\n')
   
  
    console.log('Completed all tests.')
   

    return 0 
  }



  
  // https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-core/src/builtin-tasks/test.ts
  // https://github.com/cgewecke/hardhat-gas-reporter/blob/master/src/index.ts
  
  /**
   * Overrides TASK_TEST_RUN_MOCHA_TEST to (conditionally) use eth-gas-reporter as
   * the mocha test reporter and passes mocha relevant options. These are listed
   * on the `gasReporter` of the user's config.
   */
   
  
  subtask(TASK_TEST_RUN_MOCHA_TESTS)
 
  .setAction(async ({ testFiles }: { testFiles: string[] }, hre, runSuper) => {
    
    //get access to mocha instance
    //add our tests to the same instance 


   // await initGasReporter( hre )

  /*  const { default: Mocha } = await import("mocha");
    const mocha = new Mocha(hre.config.mocha);
    testFiles.forEach((file) => mocha.addFile(file));

    const testFailures = await new Promise<number>((resolve) => {
      mocha.run(resolve);
    }); */


        console.log('meep 1 ')


        


       // const { default: Mocha } = await import("mocha")



      
       //run the gas reporter plugin 
       await runSuper({testFiles })  
 



         const mocha = new Mocha(hre.config.mocha)

        await runStoryTests(mocha,hre)
        
        //testFiles.forEach((file) => mocha.addFile(file))
        const testFailures = await new Promise((resolve, _) => {
            mocha.run(resolve)
        }) 
        return testFailures
 
     
  })

/*

  async function initGasReporter(hre: HardhatRuntimeEnvironment) : Promise<any> {
 
    const options = getGasReporterOptions(hre);
    options.getContracts = getContracts.bind(null, hre.artifacts, options.excludeContracts);

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
        mochaConfig.reporterOptions.blockLimit = ( hre.network.config as any).blockGasLimit as number;
     //   mochaConfig.attachments = {};
      }

      hre.config.mocha = mochaConfig;
      resolvedQualifiedNames = await hre.artifacts.getAllFullyQualifiedNames();
    }
  }

  function getGasReporterOptions(hre: HardhatRuntimeEnvironment): any {
    return { ...getDefaultOptions(hre), ...(hre.config as any).gasReporter };
  }

 
function getDefaultOptions(hre: HardhatRuntimeEnvironment): EthGasReporterConfig {
  const defaultUrl = "http://localhost:8545";
  const defaultCompiler = hre.config.solidity.compilers[0]

  let url: any;
  // Resolve URL
  if (( hre.network.config as HttpNetworkConfig).url) {
    url = ( hre.network.config as HttpNetworkConfig).url;
  } else {
    url = defaultUrl;
  }

  return {
    enabled: true,
    url:  url as string,
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
 
 async function getResolvedRemoteContracts(
  provider: EGRAsyncApiProvider,
  remoteContracts: RemoteContract[] = []
) : Promise <RemoteContract[]> {
  for (const contract of remoteContracts){
    let code;
    try {
      contract.bytecode = await provider.getCode(contract.address);
      contract.deployedBytecode = contract.bytecode;
      contract.bytecodeHash = sha1(contract.bytecode);
    } catch (error){
      console.log(`Warning: failed to fetch bytecode for remote contract: ${contract.name}`)
      console.log(`Error was: ${error}\n`);
    }
  }
  return remoteContracts;
}


 
 function getContracts(artifacts: Artifacts, skippable: string[] = []) : any[] {
  const contracts = [];

  for (const qualifiedName of resolvedQualifiedNames) {
    if (shouldSkipContract(qualifiedName, skippable)){
      continue;
    }

    let name: string;
    let artifact = artifacts.readArtifactSync(qualifiedName)

    // Prefer simple names
    try {
      artifact = artifacts.readArtifactSync(artifact.contractName);
      name = artifact.contractName;
    } catch (e) {
      name = qualifiedName;
    }

    contracts.push({
      name: name,
      artifact: {
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        deployedBytecode: artifact.deployedBytecode
      }
    });
  }

  for (const remoteContract of resolvedRemoteContracts){
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
  return contracts;
}


 
 function shouldSkipContract(qualifiedName: string, skippable: string[]): boolean {
  for (const item of skippable){
    if (qualifiedName.includes(item)) return true;
  }
  return false;
}*/