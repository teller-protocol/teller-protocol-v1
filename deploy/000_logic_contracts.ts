import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, log, read, deploy },
    getNamedAccounts,
    ethers,
  } = hre;
  const { deployer, admin } = await getNamedAccounts();

  // Deploy LoanLib to link it to EtherCollateralLoans and TokenCollateralLoans
  const loanLib = await deploy('LoanLib', { from: deployer });

  await deploy('TokenCollateralLoans', {
    from: deployer,
    libraries: {
      LoanLib: loanLib.address,
    },
  });

  await deploy('EtherCollateralLoans', {
    from: deployer,
    libraries: {
      LoanLib: loanLib.address,
    },
  });

  // await deploy('TToken')
  await deploy('LendingPool', { from: deployer });
  await deploy('LoanTermsConsensus', { from: deployer });
  await deploy('Escrow', { from: deployer });
  await deploy('ChainlinkAggregator', { from: deployer });
  await deploy('ATMGovernance', { from: deployer });
  await deploy('ATMLiquidityMining', { from: deployer });
  await deploy('TLRToken', { from: deployer });
  await deploy('Uniswap', { from: deployer });
  await deploy('Compound', { from: deployer });
  await deploy('EscrowFactory', { from: deployer });
  await deploy('ATMSettings', { from: deployer });
  await deploy('ATMFactory', { from: deployer });
  await deploy('MarketFactory', { from: deployer });
};

export default func;
