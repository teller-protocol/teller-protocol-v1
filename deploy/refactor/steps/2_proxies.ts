import { helper } from '../helper';

export async function deployProxies() {
  const proxyContracts = [
    {
      identifier: 'ETH_DAI_Loans_Proxy',
      contractName: 'InitializeableDynamicProxy',
      libraries: {
        LoanLib: helper.deployments.LoanLib.address,
      },
    },
    {
      identifier: 'ETH_DAI_LendingPool_Proxy',
      contractName: 'InitializeableDynamicProxy',
    },
    {
      identifier: 'ETH_DAI_LoanTermsConsensus_Proxy',
      contractName: 'InitializeableDynamicProxy',
    },
    {
      identifier: 'Settings_Proxy',
      contractName: 'UpgradeableProxy',
    },
  ];

  for (const { identifier, contractName } of proxyContracts) await helper.deploy(identifier, contractName);
}
