import { Signer } from '@ethersproject/abstract-signer';
import { Contract } from '@ethersproject/contracts';
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import hre from 'hardhat'
import { LendingPool, Settings } from '../types/typechain'
import { getMarket } from '../tasks'

chai.should();
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
      settings = await contracts.get('Settings', { from: deployer })

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

  describe('Pause lending pool', () => {
    let lendingPool: LendingPool
    // Setup for snapshot tests
    beforeEach(async () => {
      await deployments.fixture('markets')
      settings = await contracts.get('Settings', { from: deployer })

      const { lendingPoolAddress } = await getMarket({
        lendTokenSym: 'DAI',
        collTokenSym: 'ETH'
      }, hre)

      lendingPool = await contracts.get('LendingPool', { at: lendingPoolAddress })
    })

    it('Should be able to remove a platform setting as a pauser', async () => {
      // Update setting
      await settings
        .pauseLendingPool(
          lendingPool.address
        )

      const result = await settings.isPaused()

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
