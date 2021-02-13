// import { EscrowFactory, Settings } from '../../../typechain';
// import { helper } from '../helper';

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
