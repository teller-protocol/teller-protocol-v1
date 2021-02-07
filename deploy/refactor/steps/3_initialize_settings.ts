import { helper } from '../helper';
import { Settings, UpgradeableProxy } from '../../../typechain';

export async function initializeSettings() {
  await helper.call('Settings_Proxy', 'initializeProxy', async () => {
    const settingsProxyAddress = helper.deployments.Settings_Proxy.address;
    const settingsLogicAddress = helper.deployments.Settings_Logic.address;
    const settingsProxyInstance = await helper.make<UpgradeableProxy>('UpgradeableProxy', settingsProxyAddress);
    await settingsProxyInstance.initializeProxy(settingsProxyAddress, settingsLogicAddress);
  });
  await helper.call('Settings_Proxy', 'initialize', async () => {
    const settingsProxyAddress = helper.deployments.Settings_Proxy.address;
    const logicVersionsRegistryLogicAddress = helper.deployments.LogicVersionsRegistry_Logic.address;
    const settingsInstance = await helper.make<Settings>('Settings', settingsProxyAddress);
    await settingsInstance['initialize(address,address,address)'](
      logicVersionsRegistryLogicAddress,
      helper.tokens.WETH,
      helper.tokens.CETH
    );
  });
}
