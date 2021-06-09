import Chai from 'chai'
import Mocha from 'mocha'
import moment from 'moment-timezone'
import path from 'path'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'
import { updatePlatformSetting } from '../../../tasks'
import {
  generateTests,
  STORY_ACTIONS,
  TestScenario,
  TestAction,
} from './story-helpers-2'
import { generateStories } from './generator/story-generator'
// const currentDateTime = moment().tz('Australia/Sydney').format('YYYY/MM/DD/HH:mm:ss');
// const reportDirectory = path.resolve(__dirname, `../execution-report/${currentDateTime}`)
Chai.should()
Chai.use(solidity)

const mocha = new Mocha()

export const Test = Mocha.Test

export const suiteInstance = Mocha.Suite
export const suite = (suiteName = 'Suite Name') =>
  suiteInstance.create(mocha.suite, suiteName)
export const runMochaTests = () => {
  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures)
        reject('at least one test is failed, check detailed execution report')
      resolve('success')
    })
  })
}

export const defineTestSuiteAndAddTests = () => {
  const allTestStories: Array<TestScenario> = generateStories()
  for (let story of allTestStories) {
    generateTests(story)
  }
}
