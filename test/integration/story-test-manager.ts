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
): Mocha => {
  const allTestStoryDomains: Array<TestScenarioDomain> =
    generateStoryDomains(hre)

  // var allGeneratedSuites: Array<Mocha.Suite> = []

  // var allMochaInstances: Array<Mocha> = []

  var mochaInstance = new Mocha()
  mochaInstance.timeout(19000)

  for (let storyDomain of allTestStoryDomains) {
    var suiteInstance = Mocha.Suite.create(
      mochaInstance.suite,
      'Story Test Suite - '.concat(storyDomain.domainName)
    )

    console.log('storyDomain ', storyDomain)

    for (let scenario of storyDomain.scenarios) {
      let testsForDomain = generateTests(hre, scenario, suiteInstance)
    }
  }

  return mochaInstance
}
