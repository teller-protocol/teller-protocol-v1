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
};

initializeSettings.tags = ['test'];

export default initializeSettings;
