import { Contract } from '@ethersproject/contracts';
import { expect, should } from 'chai';
import { deployments, ethers } from 'hardhat';

should();

describe('Update platform setting', () => {
  const newCollateralBufferValue = 2000;
  let settingsInstance: Contract;

  before(async () => {
    await deployments.fixture('test');

    // Load settings instance
    const settingsAbi = await deployments.get('Settings');
    settingsInstance = await ethers.getContractAt('Settings', settingsAbi.address);
  });

  it('Should be able to update a platform setting as a pauser', async () => {
    // Sender address
    const pauser = (await ethers.getSigners())[1];

    // Update setting
    await settingsInstance.connect(pauser).updatePlatformSetting(ethers.utils.formatBytes32String('CollateralBuffer'), newCollateralBufferValue);

    const newCollateralBuffer = (await settingsInstance.getPlatformSetting(ethers.utils.formatBytes32String('CollateralBuffer'))).value;

    // Assert setting
    expect(newCollateralBuffer).to.equal(newCollateralBufferValue);
  });

  it('Should not be able to update a platform setting as not a pauser', async () => {
    // Sender address
    const notPauser = (await ethers.getSigners())[8];

    // Try to update setting
    await settingsInstance.connect(notPauser).updatePlatformSetting(ethers.utils.formatBytes32String('CollateralBuffer'), newCollateralBufferValue).should.be.revertedWith('NOT_PAUSER');
  });
});
