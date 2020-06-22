const assert = require('assert');
const DeployerApp = require('./utils/DeployerApp');

// Mock Smart Contracts
const DAIMock = artifacts.require("./mock/token/DAIMock.sol");
const USDCMock = artifacts.require("./mock/token/USDCMock.sol");
const LINKMock = artifacts.require("./mock/token/LINKMock.sol");
const CDAIMock = artifacts.require("./mock/providers/compound/CDAIMock.sol");
const CUSDCMock = artifacts.require("./mock/providers/compound/CUSDCMock.sol");
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
  
  await deployerApp.deployMockIfWith('DAI', DAIMock, txConfig);
  await deployerApp.deployMockIfWith('USDC', USDCMock, txConfig);
  await deployerApp.deployMockIfWith('LINK', LINKMock, txConfig);

  const initialDaiEthPrice = '4806625000000000';
  await deployerApp.deployMockIfWith('DAI_ETH', PairAggregatorMock, initialDaiEthPrice, txConfig);
  const initialUsdcEthPrice = '4789225000000000';
  await deployerApp.deployMockIfWith('USDC_ETH', PairAggregatorMock, initialUsdcEthPrice, txConfig);
  const initialDaiLinkPrice = '4789225000000000'; //TODO set a similar value
  // The Chainlink Oracle for pairs: DAI/LINK and USDC/LINK don't exist yet. So we use USD/LINK.
  await deployerApp.deployMockIfWith('USD_LINK', PairAggregatorMock, initialDaiLinkPrice, txConfig);

  const defaultMultiplier = '2';
  await deployerApp.deployMockIfWith('CDAI', CDAIMock, DAIMock.address, defaultMultiplier, txConfig);
  await deployerApp.deployMockIfWith('CUSDC', CUSDCMock, USDCMock.address, defaultMultiplier, txConfig);

  deployerApp.print();
  deployerApp.writeJson();
  console.log(`${'='.repeat(25)} Deployment process finished. ${'='.repeat(25)}`);
};