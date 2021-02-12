import { expect, should } from 'chai';
import { deployments, ethers, contracts, getNamedSigner } from 'hardhat';
import { Settings } from '../types/typechain';

should();

describe('Settings', async () => {
  let settings: Settings

  describe('Update platform setting', () => {
    const newCollateralBufferValue = 2000

    beforeEach(async () => {
      await deployments.fixture('settings')
      console.log('Pass')
      const deployer = await getNamedSigner('deployer')
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
      expect(newCollateralBuffer).to.equal(newCollateralBufferValue)
    })

    it('Should not be able to update a platform setting as not a pauser', async () => {
      // Sender address
      const { 8: notPauser } = await ethers.getSigners()

      // Try to update setting
      await settings
        .connect(notPauser)
        .updatePlatformSetting(
          ethers.utils.formatBytes32String('CollateralBuffer'),
          newCollateralBufferValue)
            .should
            .be
            .revertedWith('NOT_PAUSER')
    })
  })

})
