// import { formatBytes32String } from 'ethers/lib/utils';
// import { AssetSettings, Settings } from '../../../typechain';
// import { helper } from '../helper';

import { formatBytes32String } from 'ethers/lib/utils';
import { DeployFunction } from 'hardhat-deploy/dist/types';
import { helper } from '../test-utils/deploy-helper';

const createPlatformSettings: DeployFunction = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();

  for (const [platformSetting, { max, min, processOnDeployment, value }] of Object.entries(helper.platformSettings)) {
    if (processOnDeployment)
      await deployments.execute(
        'Settings',
        { from: deployer },
        'createPlatformSetting',
        formatBytes32String(platformSetting),
        value,
        min,
        max
      );
  }

  const tokens = helper.tokens;

  for (const [asset, { cToken, maxLoanAmount, maxTVLAmount }] of Object.entries(helper.assetSettings)) {
    await deployments.execute(
      'AssetSettings',
      { from: deployer },
      'createAssetSetting',
      tokens[asset],
      tokens[cToken],
      maxLoanAmount
    );
    await deployments.execute('AssetSettings', { from: deployer }, 'updateMaxTVL', tokens[asset], maxTVLAmount);
  }
};

createPlatformSettings.tags = ['test'];

export default createPlatformSettings;

// export async function createPlatformSettings() {
//   const settingsProxyAddress = helper.deployments.Settings_Proxy.address;
//   const settingsInstance = await helper.make<Settings>('Settings', settingsProxyAddress);

//   for (const [platformSetting, { max, min, processOnDeployment, value }] of Object.entries(helper.platformSettings)) {
//     if (processOnDeployment)
//       await helper.call('Settings_Proxy', `createPlatformSetting_${platformSetting}`, async () => {
//         console.log(`Creating platform setting ${platformSetting}`);
//         await settingsInstance.createPlatformSetting(formatBytes32String(platformSetting), value, min, max);
//       });
//   }

//   const assetSettingsAddress = await settingsInstance.assetSettings();
//   const assetSettingsInstance = await helper.make<AssetSettings>('AssetSettings', assetSettingsAddress);

//   const tokens = helper.tokens;

//   for (const [asset, { cToken, maxLoanAmount, maxTVLAmount }] of Object.entries(helper.assetSettings)) {
//     await helper.call('AssetSettings_Logic', `createAssetSetting_${asset}`, async () => {
//       console.log(`Creating asset setting ${asset} - ${JSON.stringify({ cToken, maxLoanAmount, maxTVLAmount })}`);
//       await assetSettingsInstance.createAssetSetting(tokens[asset], tokens[cToken], maxLoanAmount);
//       await assetSettingsInstance.updateMaxTVL(tokens[asset], maxTVLAmount);
//     });
//   }
// }
