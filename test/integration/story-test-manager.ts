import { HardhatRuntimeEnvironment } from 'hardhat/types'
import Mocha from 'mocha'
import { generateTests, TestScenario } from '../helpers/story/story-helpers'
import { generateStories } from '../helpers/story/generator/story-generator'

export const generateAllStoryTests = (
  hre: HardhatRuntimeEnvironment
): Array<Mocha.Test> => {
  const allTestStories: Array<TestScenario> = generateStories(hre)
  var allGeneratedTests: Array<Mocha.Test> = []

  for (let story of allTestStories) {
    let newTests = generateTests(hre, story)

    allGeneratedTests = allGeneratedTests.concat(newTests)
  }
  return allGeneratedTests
}
