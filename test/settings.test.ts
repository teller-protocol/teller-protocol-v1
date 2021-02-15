import { Signer } from '@ethersproject/abstract-signer'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import hre from 'hardhat'
import { LendingPool, Settings } from '../types/typechain'
import { getMarket } from '../tasks'

chai.should()
chai.use(chaiAsPromised)

const { deployments, ethers, contracts, getNamedSigner } = hre

describe('Settings', async () => {
  let settings: Settings
  let deployer: Signer

  // Setup for global tests
  beforeEach(async () => {
    deployer = await getNamedSigner('deployer')
  })

  describe('Update platform setting', () => {
    const newCollateralBufferValue = 2000

    // Setup for snapshot tests
    beforeEach(async () => {
      // Get snapshot
      await deployments.fixture('platform-settings')
      settings = await contracts.get('Settings', { from: deployer })
    })

    it('Should be able to update a platform setting as a pauser', async () => {
      // Update setting
      await settings.updatePlatformSetting(ethers.utils.formatBytes32String('CollateralBuffer'), newCollateralBufferValue)

      const { value: newCollateralBuffer } = await settings.getPlatformSetting(
        ethers.utils.formatBytes32String('CollateralBuffer')
      )

      // Assert setting
      newCollateralBuffer.should.equal(newCollateralBufferValue)
    })

    it('Should not be able to update a platform setting as not a pauser', async () => {
      // Sender address
      const { 8: notPauser } = await ethers.getSigners()

      // Try to update setting
      const fn = () =>
        settings
          .connect(notPauser)
          .updatePlatformSetting(ethers.utils.formatBytes32String('CollateralBuffer'), newCollateralBufferValue)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('Remove platform setting', () => {
    // Setup for snapshot tests
    beforeEach(async () => {
      await deployments.fixture('platform-settings')
      settings = await contracts.get('Settings', { from: deployer })
    })

    it('Should be able to remove a platform setting as a pauser', async () => {
      // Remove setting
      await settings.removePlatformSetting(ethers.utils.formatBytes32String('CollateralBuffer'))

      const { value: newCollateralBuffer } = await settings.getPlatformSetting(
        ethers.utils.formatBytes32String('CollateralBuffer')
      )

      // Assert setting
      newCollateralBuffer.should.equal(0)
    })

    it('Should not be able to remove a platform setting as not a pauser', async () => {
      // Sender address
      const { 6: notPauser } = await ethers.getSigners()

      // Try to remove setting
      const fn = () => settings.connect(notPauser).removePlatformSetting(ethers.utils.formatBytes32String('CollateralBuffer'))

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('Pause lending pool', () => {
    let lendingPool: LendingPool
    // Setup for snapshot tests
    beforeEach(async () => {
      await deployments.fixture('markets')
      settings = await contracts.get('Settings', { from: deployer })

      const { lendingPoolAddress } = await getMarket(
        {
          lendTokenSym: 'DAI',
          collTokenSym: 'ETH',
        },
        hre
      )

      lendingPool = await contracts.get('LendingPool', { at: lendingPoolAddress })
    })

    it('Should be able to pause a lending pool as a pauser', async () => {
      // Pause lending pool
      await settings.pauseLendingPool(lendingPool.address)

      // Try to deposit into lending pool
      const fn = () => lendingPool.deposit(100)

      await fn().should.be.rejectedWith('LENDING_POOL_IS_PAUSED')
    })

    it('Should not be able to pause a lending pool as not a pauser', async () => {
      // Sender address
      const { 6: notPauser } = await ethers.getSigners()

      // Try to pause lending pool
      const fn = () => settings.connect(notPauser).pauseLendingPool(lendingPool.address)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('Unpause lending pool', () => {
    let lendingPool: LendingPool
    // Setup for snapshot tests
    beforeEach(async () => {
      await deployments.fixture('markets')
      settings = await contracts.get('Settings', { from: deployer })

      const { lendingPoolAddress } = await getMarket(
        {
          lendTokenSym: 'DAI',
          collTokenSym: 'ETH',
        },
        hre
      )

      lendingPool = await contracts.get('LendingPool', { at: lendingPoolAddress })

      // Pause lending pool
      await settings.pauseLendingPool(lendingPool.address)
    })

    it('Should be able to unpause a lending pool as a pauser', async () => {
      // Try to unpause lending pool
      const fn = () => settings.unpauseLendingPool(lendingPool.address)

      await fn().should.be.fulfilled
    })

    it('Should not be able to unpause a lending pool as not a pauser', async () => {
      // Sender address
      const { 6: notPauser } = await ethers.getSigners()

      // Try to unpause lending pool
      const fn = () => settings.connect(notPauser).unpauseLendingPool(lendingPool.address)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })
})
