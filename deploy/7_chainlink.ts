// import { ChainlinkAggregator, Settings } from '../../../typechain';
// import { helper } from '../helper';

import { DeployFunction } from 'hardhat-deploy/dist/types';
import { helper } from './refactor/helper';

const addChainlinkPairs: DeployFunction = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();

  const tokens = helper.tokens;

  for (const { address, baseTokenName, quoteTokenName } of Object.values(helper.chainlink)) {
    await deployments.execute(
      'ChainlinkAggregator',
      { from: deployer },
      'add',
      tokens[baseTokenName],
      tokens[quoteTokenName],
      address
    );
  }
};

addChainlinkPairs.tags = ['test'];

export default addChainlinkPairs;
