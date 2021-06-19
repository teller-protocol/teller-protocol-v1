import { HardhatRuntimeEnvironment } from 'hardhat/types'
import Mocha from 'mocha'
import {
  generateStoryTests,
  StoryTest,
  TestScenario,
} from '../helpers/story/story-helpers'
import { generateStories } from '../helpers/story/generator/story-generator'

export const generateAllStoryTests = (
  hre: HardhatRuntimeEnvironment
): Array<StoryTest> => {
  const allTestStories: Array<TestScenario> = generateStories()
  var allGeneratedTests: Array<StoryTest> = []

  for (let story of allTestStories) {
    let newTests = generateStoryTests(hre, story)

    allGeneratedTests = allGeneratedTests.concat(newTests)
  }
  return allGeneratedTests
}
