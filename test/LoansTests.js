const Loans = artifacts.require('Loans')
const Mock = artifacts.require('Mock')
const EtherUsdAggregator = artifacts.require('EtherUsdAggregator')
const SimpleToken = artifacts.require('SimpleToken')
const MockDAIPool = artifacts.require('MockDAIPool')

const assert = require('assert')
const time = require('ganache-time-traveler')


contract('Loans Unit Tests', async accounts => {
  const owner = accounts[0]
  const tradeWallet = accounts[1]
  const notOwner = accounts[2]
  const notTradeWallet = accounts[3]

  let mockOracle
  let mockOracleInterface
  let mockDaiPool
  let mockDaiPoolInterface

  let loans

  beforeEach(async () => {
    const snapShot = await time.takeSnapshot()
    snapshotId = snapShot['result']
  })

  afterEach(async () => {
    await time.revertToSnapshot(snapshotId)
  })

  async function setupMockContracts() {
    mockOracle = await Mock.new()
    mockDaiPool = await Mock.new()

    mockOracleInterface = await EtherUsdAggregator.new(accounts[1])
    mockDaiPoolInterface = await MockDAIPool.new()

    // mockStakingToken_transfer = await mockFungibleTokenTemplate.contract.methods
    //   .transfer(EMPTY_ADDRESS, 0)
    //   .encodeABI()

    // mockStakingToken_approve = await mockFungibleTokenTemplate.contract.methods
    //   .approve(EMPTY_ADDRESS, 0)
    //   .encodeABI()
  }

  before('Deploy Loans Contract', async () => {
    await setupMockContracts()
    loans = await Loans.new(
      mockOracle.address,
      mockDaiPool.address
    )
  })

  describe('Test deploying the contract', async () => {
    it('should set the addresses of the oracle and pool', async () => {
      let result = await loans.priceOracle.call()
      assert.equal(result, mockOracle.address, 'Oracle address not set correctly')
      
      result = await loans.daiPool.call()
      assert.equal(result, mockDaiPool.address, 'DAI Pool address not set correctly')
    })
  })

})