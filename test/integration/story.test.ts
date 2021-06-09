import Chai from 'chai'

import Mocha from 'mocha'

import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'
import { updatePlatformSetting } from '../../tasks'
import {
  generateTests,
  STORY_ACTIONS,
  TestScenario,
  TestAction,
} from '../helpers/story/story-helpers-2'
import { generateStories } from '../helpers/story/generator/story-generator'

chai.should()
chai.use(solidity)

const testScenarios = [
  {
    domain: 'LOAN',
    actions: [
      { actionType: STORY_ACTIONS.LOAN.TAKE_OUT, args: {} },
      { actionName: STORY_ACTIONS.LOAN.LIQUIDATE, args: {} },
    ],
  },
  {
    domain: 'LOAN',
    actions: [
      { actionType: STORY_ACTIONS.LOAN.TAKE_OUT, args: {} },
      { actionName: STORY_ACTIONS.LOAN.REPAY, args: {} },
    ],
  },
]

describe.only('story test', async () => {
  const allTestStories: Array<TestScenario> = generateStories()

  console.log(
    'Generating tests for the following stories:',
    JSON.stringify(allTestStories)
  )

  var allGeneratedTests: Array<any> = []

  for (let story of allTestStories) {
    let newTests = generateTests(story)

    allGeneratedTests = allGeneratedTests.concat(newTests)
  }

  console.log('Generated tests:', JSON.stringify(allGeneratedTests))

  //https://gist.github.com/cybertk/fff8992e12a7655157ed

  // Run tests for all markets
  /*const args = {
    pass: true,
    type: STORY_ACTIONS.LOAN.TAKE_OUT,
    // revert: '',
    // description: 'shoud do another stuff',
  }*/

  let Suite = Mocha.Suite
  var Test = Mocha.Test
  var expect = Chai.expect

  var mochaInstance = new Mocha()
  var suiteInstance = Mocha.Suite.create(mochaInstance.suite, 'Test Suite')

  suiteInstance.addTest(
    new Test('testing tests', function () {
      expect(2).to.equal(2)
    })
  )

  before(async () => {
    await updatePlatformSetting(
      {
        name: 'RequiredSubmissionsPercentage',
        value: 100,
      },
      hre
    )
  })

  mochaInstance.run()

  it(`Run story tests`, async () => {
    // await generateTests(args)
  })
})
