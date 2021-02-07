import { formatBytes32String } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { InitializeableDynamicProxy } from '../../../typechain';
import { helper } from '../helper';

export async function initializeProxies() {
  const logicNames = [
    {
      identifier: 'ETH_DAI_Loans_Proxy',
      logicName: 'EtherCollateralLoans',
    },
    { identifier: 'ETH_DAI_LendingPool_Proxy', logicName: 'LendingPool' },
    { identifier: 'ETH_DAI_LoanTermsConsensus_Proxy', logicName: 'LoanTermsConsensus' },
  ];

  const settingsProxyAddress = helper.deployments.Settings_Proxy.address;

  for (const { identifier, logicName } of logicNames) {
    const logicNameBytes32 = ethers.utils.solidityKeccak256(['bytes32'], [formatBytes32String(logicName)]);
    await helper.call(identifier, 'initializeProxy', async () => {
      const proxyAddress = helper.deployments[identifier].address;
      const proxy = await helper.make<InitializeableDynamicProxy>('InitializeableDynamicProxy', proxyAddress);
      await proxy.initializeProxy(settingsProxyAddress, logicNameBytes32);
    });
  }
}
