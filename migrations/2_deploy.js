const assert = require('assert');
const DeployerApp = require('./utils/DeployerApp');

// Mock Smart Contracts

// Libraries
const AddressLib = artifacts.require("./util/AddressLib.sol");
const SafeMath = artifacts.require("./util/SafeMath.sol");

// Official Smart Contracts
const ZDai = artifacts.require("./base/ZDai.sol");
const LenderInfo = artifacts.require("./base/LenderInfo.sol");
const DAIPool = artifacts.require("./base/DAIPool.sol");
const EtherUsdAggregator = artifacts.require("./providers/chainlink/EtherUsdAggregator.sol");

module.exports = async function(deployer, network, accounts) {
  console.log(`Deploying smart contracts to '${network}'.`)
  // Getting network configuration.
  const appConfig = require('../config')(network);
  const { networkConfig, env } = appConfig;

  // Getting configuration values.
  const deployerAccountIndex = env.getDefaultAddressIndex().getOrDefault();
  const deployerAccount = accounts[deployerAccountIndex];
  console.log(`Deployer account index is ${deployerAccountIndex} => ${deployerAccount}`);
  const { maxGasLimit, tokens } = networkConfig;
  assert(maxGasLimit, `Max gas limit for network ${network} is undefined.`);
  const deployOptions = { gas: maxGasLimit, from: deployerAccount };

  // Creating DeployerApp helper.
  const deployerApp = new DeployerApp(deployer, web3, deployerAccount, network);

  await deployerApp.deploys([ AddressLib, SafeMath, ZDai ], deployOptions);

  await deployerApp.links(DAIPool, [ AddressLib ]);
  await deployerApp.deploy(DAIPool, deployOptions);
  
  await deployerApp.links(LenderInfo, [ AddressLib, SafeMath ]);
  await deployerApp.deploy(LenderInfo, ZDai.address, DAIPool.address, deployOptions);

  const loanInfoAddress = accounts[4];// TODO Change it when the Loans is merged;

  const daiPoolInstance = await DAIPool.deployed();
  await daiPoolInstance.initialize(
    ZDai.address,
    tokens.DAI,
    LenderInfo.address,
    loanInfoAddress
  );

  const { chainlink: { dataContracts: { eth_usd } } } = networkConfig;
  assert(eth_usd, 'Chainlinnk ETH/USD data contract is undefined.');
  await deployerApp.deploy(EtherUsdAggregator, eth_usd, deployOptions);

  deployerApp.print();
  deployerApp.writeJson();
  console.log(`${'='.repeat(25)} Deployment process finished. ${'='.repeat(25)}`);
};