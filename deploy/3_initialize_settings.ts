import { DeployFunction } from 'hardhat-deploy/dist/types';
import { helper } from './refactor/helper';

const initializeSettings: DeployFunction = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();
  const settingsProxy = await deployments.get('Settings_Proxy');
  const settingsLogic = await deployments.get('Settings_Logic');
  const logicVersionsRegistryLogic = await deployments.get('LogicVersionsRegistry_Logic');

  await deployments.execute(
    'Settings_Proxy',
    { from: deployer },
    'initializeProxy',
    settingsProxy.address,
    settingsLogic.address
  );
  await deployments.execute(
    'Settings',
    { from: deployer },
    'initialize(address,address,address)',
    logicVersionsRegistryLogic.address,
    helper.tokens.WETH,
    helper.tokens.CETH
  );

  const logicVersionsRegistryProxyAddress = await deployments.read('Settings', { from: deployer }, 'versionsRegistry');
  await deployments.save('LogicVersionsRegistry', {
    address: logicVersionsRegistryProxyAddress,
    abi: logicVersionsRegistryLogic.abi,
  });

  const chainlinkAggregatorProxyAddress = await deployments.read('Settings', { from: deployer }, 'chainlinkAggregator');
  const chainlinkAggregatorLogic = await deployments.get('ChainlinkAggregator_Logic');
  await deployments.save('ChainlinkAggregator', { address: chainlinkAggregatorProxyAddress, abi: chainlinkAggregatorLogic.abi });

  const assetSettingsProxyAddress = await deployments.read('Settings', { from: deployer }, 'assetSettings');
  const assetSettingsLogic = await deployments.get('AssetSettings_Logic');
  await deployments.save('AssetSettings', { address: assetSettingsProxyAddress, abi: assetSettingsLogic.abi });

  const escrowFactoryProxyAddress = await deployments.read('Settings', { from: deployer }, 'escrowFactory');
  const escrowFactoryLogic = await deployments.get('EscrowFactory_Logic');
  await deployments.save('EscrowFactory', { address: escrowFactoryProxyAddress, abi: escrowFactoryLogic.abi });

  const marketFactoryProxyAddress = await deployments.read('Settings', { from: deployer }, 'marketFactory');
  const marketFactoryLogic = await deployments.get('MarketFactory_Logic');
  await deployments.save('MarketFactory', { address: marketFactoryProxyAddress, abi: marketFactoryLogic.abi });
};

initializeSettings.tags = ['test'];

export default initializeSettings;
