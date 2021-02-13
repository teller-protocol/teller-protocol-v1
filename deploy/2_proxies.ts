import { DeployFunction } from 'hardhat-deploy/dist/types';

const deployProxies: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts();

  const proxyContracts = [
    {
      identifier: 'ETH_DAI_Loans_Proxy',
      logicContractName: 'Loans',
      proxyContractName: 'InitializeableDynamicProxy',
    },
    {
      identifier: 'ETH_DAI_LendingPool_Proxy',
      logicContractName: 'LendingPool',
      proxyContractName: 'InitializeableDynamicProxy',
    },
    {
      identifier: 'ETH_DAI_LoanTermsConsensus_Proxy',
      logicContractName: 'LoanTermsConsensus',
      proxyContractName: 'InitializeableDynamicProxy',
    },
    {
      identifier: 'Settings_Proxy',
      logicContractName: 'Settings',
      proxyContractName: 'UpgradeableProxy',
    },
  ];

  for (const { identifier, logicContractName, proxyContractName } of proxyContracts) {
    const proxyDeployment = await deployments.deploy(identifier, { from: deployer, contract: proxyContractName });
    const { abi } = await deployments.getArtifact(logicContractName);
    await deployments.save(logicContractName, {
      abi,
      address: proxyDeployment.address,
    });
  }
};

deployProxies.tags = ['test'];

export default deployProxies;
