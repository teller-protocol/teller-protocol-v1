import chai from 'chai'
import { solidity } from 'ethereum-waffle'
// import hre from 'hardhat'
import { generateTests, LOAN_ACTIONS } from '../helpers/story-helpers'

chai.should()
chai.use(solidity)

// const {
//   contracts,
//   tokens,
//   deployments,
//   getNamedSigner,
//   ethers,
//   network,
//   evm,
//   toBN,
// } = hre

describe.only('story test', async () => {
  // Run tests for all markets
  const expectedResult = {
    type: true,
    revert: 'Promise',
  }
  await generateTests(LOAN_ACTIONS[0], expectedResult)
})
