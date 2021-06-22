import { HardhatRuntimeEnvironment } from 'hardhat/types'
import Mocha from 'mocha'
import {
  generateTests,
  TestScenario,
  TestScenarioDomain,
} from '../helpers/story/story-helpers'
import { generateStoryDomains } from '../helpers/story/generator/story-generator'

export const generateAllStoryTests = (
  hre: HardhatRuntimeEnvironment
): Array<Mocha> => {
  const allTestStoryDomains: Array<TestScenarioDomain> =
    generateStoryDomains(hre)

  // var allGeneratedSuites: Array<Mocha.Suite> = []

  var allMochaInstances: Array<Mocha> = []

  for (let storyDomain of allTestStoryDomains) {
    var mochaInstance = new Mocha()
    mochaInstance.timeout(19000)

    var suiteInstance = Mocha.Suite.create(
      mochaInstance.suite,
      'Story Test Suite - '.concat(storyDomain.domainName)
    )

    console.log('storyDomain ', storyDomain)

    for (let scenario of storyDomain.scenarios) {
      let testsForDomain = generateTests(hre, scenario, suiteInstance)

      // for(let t of testsForDomain){
      //  suiteInstance.addTest(  t  )
      // }
    }

    allMochaInstances.push(mochaInstance)
  }

  /*for (let story of allTestStories) {
  

    let newSuite:Mocha.Suite = new Mocha().suite
    
    generateTests(hre, story, newSuite)

    allGeneratedTests = allGeneratedTests.concat(newTests)
  }*/

  return allMochaInstances
}
