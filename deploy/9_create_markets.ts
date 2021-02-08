// import { MarketFactory, Settings } from "../../../typechain";
// import { helper } from "../helper";

import { DeployFunction } from 'hardhat-deploy/dist/types';
import { helper } from './refactor/helper';

const createMarkets: DeployFunction = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();

  const tokens = helper.tokens;

  for (const { borrowedToken, collateralToken } of helper.markets) {
    console.log(tokens[borrowedToken], tokens[collateralToken]);
    await deployments.execute(
      'MarketFactory',
      { from: deployer },
      'createMarket',
      tokens[borrowedToken],
      tokens[collateralToken]
    );
  }
};

createMarkets.tags = ['test'];

export default createMarkets;

// export async function createMarkets(): Promise<void> {
//     const settingsProxyAddress = helper.deployments.Settings_Proxy.address;
//     const settingsInstance = await helper.make<Settings>("Settings", settingsProxyAddress);
//     const marketFactoryAddress = await settingsInstance.marketFactory();
//     const marketFactoryInstance = await helper.make<MarketFactory>("MarketFactory", marketFactoryAddress);

//     const tokens = helper.tokens;

//     for (const { borrowedToken, collateralToken } of helper.markets) {
//         await helper.call("MarketFactory_Logic", `createMarket_${collateralToken}-${borrowedToken}`, async () => {
//             await marketFactoryInstance.createMarket(tokens[borrowedToken], tokens[collateralToken])
//         })
//     }
// }
