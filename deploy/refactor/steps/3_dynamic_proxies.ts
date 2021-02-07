import { formatBytes32String } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { helper } from '../helper';

export async function deployDynamicProxies() {
  const proxyContracts = [
    {
      identifier: 'Uniswap_Proxy',
      contractName: 'DynamicProxy',
      logicName: 'Uniswap',
    },
    {
      identifier: 'Compound_Proxy',
      contractName: 'DynamicProxy',
      logicName: 'Uniswap',
    },
  ];

  const settingsProxyAddress = helper.deployments.Settings_Proxy.address;

  for (const { identifier, contractName, logicName } of proxyContracts)
    await helper.deploy(identifier, contractName, [
      settingsProxyAddress,
      ethers.utils.solidityKeccak256(['bytes32'], [formatBytes32String(logicName)]),
    ]);
}
