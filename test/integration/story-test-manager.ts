//import Chai from 'chai'

import { HardhatRuntimeEnvironment } from 'hardhat/types'
import Mocha from 'mocha'
//import { solidity } from 'ethereum-waffle'

//import { updatePlatformSetting } from '../../tasks'
import {
  generateTests,
  //STORY_ACTIONS,
  TestScenario,
  // TestAction,
} from '../helpers/story/story-helpers'
import { generateStories } from '../helpers/story/generator/story-generator'

//Chai.should()
//Chai.use(solidity)

export const generateAllStoryTests = (
  hre: HardhatRuntimeEnvironment
): Array<Mocha.Test> => {
  // console.log('run all story tests', mocha )

  const allTestStories: Array<TestScenario> = generateStories()

  var allGeneratedTests: Array<Mocha.Test> = []

  for (let story of allTestStories) {
    let newTests = generateTests(hre, story)

    allGeneratedTests = allGeneratedTests.concat(newTests)
  }

  //  console.log('subtask to comandeer mocha tests ', allGeneratedTests)

  return allGeneratedTests
}

export const readTestsFromFile = (contents: string): Mocha.Test => {
  return ''
}

/*
export const convertMochaTestToFile = (test:Mocha.Test):string => {


  return JSON.stringify(test )
}*/

/*

describe.only('story test', async () => {
  const allTestStories: Array<TestScenario> = generateStories()

  // console.log(
  //   'Generating tests for the following stories:',
  //   JSON.stringify(allTestStories)
  // )

  var allGeneratedTests: Array<any> = []

  for (let story of allTestStories) {
    let newTests = generateTests(story)

    allGeneratedTests = allGeneratedTests.concat(newTests)
  }

  // console.log('Generated tests:', JSON.stringify(allGeneratedTests))

  let Suite = Mocha.Suite
  var Test = Mocha.Test
  var expect = Chai.expect

  var mochaInstance = new Mocha({
    timeout: 10000,
  })
  var suiteInstance = Mocha.Suite.create(
    mochaInstance.suite,
    'Story Test Suite'
  )
  console.log({ tests: allGeneratedTests.length })
  // for (let test of allGeneratedTests) {
  //   suiteInstance.addTest(test)
  // }
  allGeneratedTests.map((test) => suiteInstance.addTest(test))

 
  //run all of the generated story tests (they are async)
  mochaInstance.run()
})
*/
