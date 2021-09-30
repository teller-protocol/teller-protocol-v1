import { HardhatRuntimeEnvironment } from 'hardhat/types'
import Mocha from 'mocha'

import { generateStoryDomains } from '../helpers/story/generator/story-generator'
import {
  generateTests,
  TestScenarioDomain,
} from '../helpers/story/story-helpers'

export const generateAllStoryTests = (
  mochaInstance: Mocha,
  hre: HardhatRuntimeEnvironment
): void => {
  const allTestStoryDomains: TestScenarioDomain[] = generateStoryDomains()

  for (const storyDomain of allTestStoryDomains) {
    const suiteInstance = Mocha.Suite.create(
      mochaInstance.suite,
      'Story Test Suite - '.concat(storyDomain.domainName)
    )

    suiteInstance.beforeAll(async () => {
      await hre.deployments.fixture('markets', {
        keepExistingDeployments: true,
      })
    })

    for (const scenario of storyDomain.scenarios) {
      generateTests(hre, scenario, suiteInstance)
    }
  }
}
