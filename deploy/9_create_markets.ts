import { DeployFunction } from 'hardhat-deploy/dist/types';
import { helper } from '../test-utils/deploy-helper';

const createMarkets: DeployFunction = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();

  const tokens = helper.tokens;

  for (const { borrowedToken, collateralToken } of helper.markets) {
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
