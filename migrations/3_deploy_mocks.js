const assert = require('assert');
const DeployerApp = require('./utils/DeployerApp');

// Mock Smart Contracts
const DAIMock = artifacts.require("./mock/token/DAIMock.sol");
const USDCMock = artifacts.require("./mock/token/USDCMock.sol");
const PairAggregatorMock = artifacts.require("./mock/providers/chainlink/PairAggregatorMock.sol");

module.exports = async function(deployer, network, accounts) {
  console.log(`Deploying smart contracts to '${network}'.`)
  // Getting network configuration.
  const appConfig = require('../config')(network);
  const { networkConfig, env } = appConfig;

  // Getting configuration values.
  const deployerAccountIndex = env.getDefaultAddressIndex().getOrDefault();
  const deployerAccount = accounts[deployerAccountIndex];
  console.log(`Deployer account index is ${deployerAccountIndex} => ${deployerAccount}`);
  const { maxGasLimit } = networkConfig;
  assert(maxGasLimit, `Max gas limit for network ${network} is undefined.`);

  const txConfig = { gas: maxGasLimit, from: deployerAccount };

  // Creating DeployerApp helper.
  const deployerApp = new DeployerApp(deployer, web3, deployerAccount, network);
  
  await deployerApp.deployMocksIf([DAIMock, USDCMock], txConfig);

  const initialDaiEthPrice = '4806625000000000';
  const initialUsdcEthPrice = '4789225000000000';
  await deployerApp.deployMockIfWith('DAI_ETH', PairAggregatorMock, initialDaiEthPrice, txConfig);
  await deployerApp.deployMockIfWith('USDC_ETH', PairAggregatorMock, initialUsdcEthPrice, txConfig);

  deployerApp.print();
  deployerApp.writeJson();
  console.log(`${'='.repeat(25)} Deployment process finished. ${'='.repeat(25)}`);
};