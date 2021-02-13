// import { MarketFactory, Settings } from "../../../typechain";
// import { helper } from "../helper";

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
