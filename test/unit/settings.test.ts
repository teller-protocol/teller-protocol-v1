import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import hre from 'hardhat'
import { Settings } from '../../types/typechain'

chai.should()
chai.use(chaiAsPromised)

const { deployments, ethers, contracts, getNamedSigner } = hre

const setupTest = deployments.createFixture(async () => {
  await deployments.fixture('platform-settings')

  const deployer = await getNamedSigner('deployer')
  const settings = await contracts.get<Settings>('Settings', { from: deployer })

  return {
    settings,
  }
})

describe('Settings', async () => {
  let settings: Settings

  // Setup for global tests
  beforeEach(async () => {
    // Execute snapshot and setup for tests
    const setup = await setupTest()

    settings = setup.settings
  })

  describe('Update platform setting', () => {
    const newCollateralBufferValue = 2000

    it('Should be able to update a platform setting as a pauser', async () => {
      // Update setting
      await settings.updatePlatformSetting(
        ethers.utils.formatBytes32String('CollateralBuffer'),
        newCollateralBufferValue
      )

      const newCollateralBuffer = await settings.getCollateralBufferValue()

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
          .updatePlatformSetting(
            ethers.utils.formatBytes32String('CollateralBuffer'),
            newCollateralBufferValue
          )

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('Remove platform setting', () => {
    it('Should be able to remove a platform setting as a pauser', async () => {
      // Remove setting
      await settings.removePlatformSetting(
        ethers.utils.formatBytes32String('CollateralBuffer')
      )

      const newCollateralBuffer = await settings.getCollateralBufferValue()

      // Assert setting
      newCollateralBuffer.should.equal(0)
    })

    it('Should not be able to remove a platform setting as not a pauser', async () => {
      // Sender address
      const { 6: notPauser } = await ethers.getSigners()

      // Try to remove setting
      const fn = () =>
        settings
          .connect(notPauser)
          .removePlatformSetting(
            ethers.utils.formatBytes32String('CollateralBuffer')
          )

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('Pause lending pool', () => {
    const lendingPoolAddress = '0x0000000000000000000000000000000000000001'

    it('Should be able to pause a lending pool as a pauser', async () => {
      // Check if lending pool is paused
      const fn = () => settings.lendingPoolPaused(lendingPoolAddress)

      await fn().should.eventually.be.false

      // Pause lending pool
      await settings.pauseLendingPool(lendingPoolAddress)

      await fn().should.eventually.be.true
    })

    it('Should not be able to pause a lending pool as not a pauser', async () => {
      // Sender address
      const { 6: notPauser } = await ethers.getSigners()

      // Try to pause lending pool
      const fn = () =>
        settings.connect(notPauser).pauseLendingPool(lendingPoolAddress)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('Unpause lending pool', () => {
    const lendingPoolAddress = '0x0000000000000000000000000000000000000001'

    // Setup for tests
    beforeEach(async () => {
      // Pause lending pool
      await settings.pauseLendingPool(lendingPoolAddress)
    })

    it('Should be able to unpause a lending pool as a pauser', async () => {
      // Check if lending pool is paused
      const fn = () => settings.lendingPoolPaused(lendingPoolAddress)

      await fn().should.eventually.be.true

      // Unpause lending pool
      await settings.unpauseLendingPool(lendingPoolAddress)

      await fn().should.eventually.be.false
    })

    it('Should not be able to unpause a lending pool as not a pauser', async () => {
      // Sender address
      const { 6: notPauser } = await ethers.getSigners()

      // Try to unpause lending pool
      const fn = () =>
        settings.connect(notPauser).unpauseLendingPool(lendingPoolAddress)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })
})
