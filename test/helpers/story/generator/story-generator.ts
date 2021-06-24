import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
  TREE_STRUCTURE,
  TestScenario,
  StoryValues,
  TestAction,
  TestScenarioDomain,
} from '../story-helpers'

export const generateStoryDomains = (
  hre: HardhatRuntimeEnvironment
): Array<TestScenarioDomain> => {
  let proceduralScenarioDomains: TestScenarioDomain[] = []

  for (const [key, value] of Object.entries(TREE_STRUCTURE)) {
    const scenarioArray = generateDomainScenarios(key, value, hre)
    let newSDomain: TestScenarioDomain = {
      domainName: key,
      scenarios: scenarioArray,
    }
    proceduralScenarioDomains.push(newSDomain)
  }
  return proceduralScenarioDomains
}

const generateDomainScenarios = (
  key: string,
  value: StoryValues,
  hre: HardhatRuntimeEnvironment
) => {
  const testCases = []
  // if (hre.network.name == '') {

  // }
  const splitStructure = key.split('.')
  const domain = splitStructure[0]
  const actions: TestAction[] = []
  const parentactions: TestAction[] = []
  const action = splitStructure[splitStructure.length - 1]
  let test: TestAction = {
    actionParentType: domain == 'DAPP' ? splitStructure[1] : undefined,
    actionType: action,
    suiteName: `${domain} ${action} test`,
    args: {},
  }
  actions.unshift(test)
  testCases.push({ domain, actions })
  if (value.parents) {
    value.parents.map((value) => {
      parentactions.unshift(parseParents(value))
    })
    parentactions.push(test)
    testCases.push({ domain, actions: parentactions })
  }
  return testCases
}

const parseParents = (structure: string): TestAction => {
  const structureSplit = structure.split('.')
  const domain = structureSplit[0]
  const action = structureSplit[structureSplit.length - 1]
  const value: StoryValues = TREE_STRUCTURE[structure]
  let test: TestAction = {
    actionParentType: domain == 'DAPP' ? structureSplit[1] : undefined,
    actionType: action,
    suiteName: `${domain} ${action} test`,
    args: {},
  }
  return test
}
