import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'
import { updatePlatformSetting } from '../../tasks'
import { generateTests, LOAN_ACTIONS } from '../helpers/story-helpers'

chai.should()
chai.use(solidity)

describe.only('story test', async () => {
  // Run tests for all markets
  const args = {
    pass: true,
    type: LOAN_ACTIONS[0],
    revert: '',
    // description: 'shoud do another stuff',
  }
  before(async () => {
    await updatePlatformSetting(
      {
        name: 'RequiredSubmissionsPercentage',
        value: 100,
      },
      hre
    )
  })
  it(`Run story tests`, async () => {
    await generateTests(args)
  })
})
