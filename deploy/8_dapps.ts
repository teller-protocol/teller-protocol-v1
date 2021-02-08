// import { EscrowFactory, Settings } from '../../../typechain';
// import { helper } from '../helper';

import { DeployFunction } from 'hardhat-deploy/dist/types';

const addDapps: DeployFunction = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();

  const uniswap = await deployments.get('Uniswap');
  const compound = await deployments.get('Compound');

  await deployments.execute('EscrowFactory', { from: deployer }, 'addDapp', uniswap.address, false);
  await deployments.execute('EscrowFactory', { from: deployer }, 'addDapp', compound.address, true);
};

addDapps.tags = ['test'];

export default addDapps;

// export async function addDapps() {
//   const settingsProxyAddress = helper.deployments.Settings_Proxy.address;
//   const settingsInstance = await helper.make<Settings>('Settings', settingsProxyAddress);
//   const escrowFactoryAddress = await settingsInstance.escrowFactory();
//   const escrowFactoryInstance = await helper.make<EscrowFactory>('EscrowFactory', escrowFactoryAddress);
//   const uniswapProxyAddress = helper.deployments.Uniswap_Proxy.address;
//   const compoundProxyAddress = helper.deployments.Compound_Proxy.address;

//   await helper.call('EscrowFactory_Logic', `addDapp_Uniswap`, async () => {
//     await escrowFactoryInstance.addDapp(uniswapProxyAddress, false);
//   });

//   await helper.call('EscrowFactory_Logic', 'addDapp_Compound', async () => {
//     await escrowFactoryInstance.addDapp(compoundProxyAddress, true);
//   });
// }
