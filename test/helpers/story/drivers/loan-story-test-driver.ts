import { Test } from 'mocha'
import { TestScenario } from '../story-helpers-2'
import StoryTestDriver from './story-test-driver'

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
