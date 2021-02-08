import { ethers } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/dist/types';

const initializeDynamicProxies: DeployFunction = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();
  const settings = await deployments.get('Settings');

  const contracts = [
    {
      proxyIdentifier: 'ETH_DAI_Loans_Proxy',
      logicNameBytes32: ethers.utils.id('Loans'),
    },
    {
      proxyIdentifier: 'ETH_DAI_LendingPool_Proxy',
      logicNameBytes32: ethers.utils.id('LendingPool'),
    },
    {
      proxyIdentifier: 'ETH_DAI_LoanTermsConsensus_Proxy',
      logicNameBytes32: ethers.utils.id('LoanTermsConsensus'),
    },
  ];

  for (const { proxyIdentifier, logicNameBytes32 } of contracts) {
    await deployments.execute(proxyIdentifier, { from: deployer }, 'initializeProxy', settings.address, logicNameBytes32);
  }
};

initializeDynamicProxies.tags = ['test'];

export default initializeDynamicProxies;
