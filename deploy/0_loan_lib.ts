import { DeployFunction } from 'hardhat-deploy/types';

const deployLoanLib: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts();
  await deployments.deploy('LoanLib', { from: deployer, contract: 'LoanLib' });
};

deployLoanLib.tags = ['test'];

export default deployLoanLib;
