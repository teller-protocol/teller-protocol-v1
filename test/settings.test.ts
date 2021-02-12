import { Signer } from '@ethersproject/abstract-signer';
import { Contract } from '@ethersproject/contracts';
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, ethers, contracts, getNamedSigner } from 'hardhat'
import { LendingPool, Settings } from '../types/typechain'

chai.should();
chai.use(chaiAsPromised)

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
      settings = await contracts.get<Settings>('Settings', { from: deployer })
    })

    it('Should be able to update a platform setting as a pauser', async () => {

      // Update setting
      await settings
        .updatePlatformSetting(
          ethers.utils.formatBytes32String('CollateralBuffer'),
          newCollateralBufferValue
        )

      const { value: newCollateralBuffer } = await settings.getPlatformSetting(ethers.utils.formatBytes32String('CollateralBuffer'))

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

    // Setup for snapshot tests
    beforeEach(async () => {
      await deployments.fixture('platform-settings')
      settings = await contracts.get<Settings>('Settings', { from: deployer })

    })

    it('Should be able to remove a platform setting as a pauser', async () => {

      // Remove setting
      await settings
        .removePlatformSetting(
          ethers.utils.formatBytes32String('CollateralBuffer')
        )

      const { value: newCollateralBuffer } = await settings.getPlatformSetting(ethers.utils.formatBytes32String('CollateralBuffer'))

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

  describe.skip('Pause lending pool', () => {
    let lendingPool: Contract
    // Setup for snapshot tests
    beforeEach(async () => {
      await deployments.fixture('markets')
      settings = await contracts.get<Settings>('Settings', { from: deployer })

      lendingPool = await contracts.get<LendingPool>('LendingPool', { from: deployer })
    })

    it('Should be able to remove a platform setting as a pauser', async () => {
      // Update setting
      await settings
        .pauseLendingPool(
          lendingPool.address
        )

      const result: Boolean = await settings.isPaused()

      // Assert setting
      result.should.equal(true)
    })

    it('Should not be able to remove a platform setting as not a pauser', async () => {
      // Sender address
      const { 6: notPauser } = await ethers.getSigners()

      // Try to update setting
      const fn = () =>
        settings
          .connect(notPauser)
          .pauseLendingPool(
            lendingPool.address
          )

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

})
