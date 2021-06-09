import Chai from 'chai'

import Mocha from 'mocha'

import { Test } from 'mocha'
import { TestScenario } from '../story-helpers-2'
import StoryTestDriver from './story-test-driver'

var expect = Chai.expect

/*
We will read state data from the chaindata to determine whether or not each 'action' should pass or fail at the current moment 
Then we will expect that 
*/

export default class LoanStoryTestDriver extends StoryTestDriver {
  static generateDomainSpecificTestsForScenario(
    scenario: TestScenario
  ): Array<Test> {
    let tests = []

    let newTest = new Test('testing stories', function () {
      expect(1).to.equal(2)
    })

    tests.push(newTest)

    return tests
  }
}
