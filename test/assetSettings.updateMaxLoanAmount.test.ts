import { Contract } from '@ethersproject/contracts';
import { Address } from 'cluster';
import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { Deployment } from 'hardhat-deploy/dist/types';

describe('Settings update asset setting test', () => {
  let maxLoanAmount: Number;
  let settingsAbi: Deployment;
  let settingsInstance: Contract;
  let assetSettingsInstance: Contract;
  let daiAddress: Address;

  before(async () => {
    await deployments.fixture('test');
    // Load settings instance
    settingsAbi = await deployments.get('Settings_Proxy');
    settingsInstance = await ethers.getContractAt('Settings', settingsAbi.address);
    // Load asset settings instance
    assetSettingsInstance = await ethers.getContractAt('AssetSettings', await settingsInstance.assetSettings());
    // Load Dai address
    daiAddress = (await ethers.getContractAt('ETH_DAI_LendingPool', (await deployments.get('ETH_DAI_LendingPool')).address)).lendingToken();

  });

  it('Should pass', async () => {
    console.log({daiAddress});
  });

});
