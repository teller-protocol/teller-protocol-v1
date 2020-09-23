const assert = require('assert');
const logicNames = require('../test/utils/logicNames');
const DeployerApp = require('./utils/DeployerApp');
const deployLogicContracts = require('./utils/init_settings/deployLogicContracts');
const InitializeableDynamicProxy = artifacts.require("./base/InitializeableDynamicProxy.sol");

// Mock Smart Contracts
const Settings = artifacts.require('./base/Settings.sol');
const EscrowFactory = artifacts.require('./base/EscrowFactory.sol');
const MarketFactory = artifacts.require('./base/MarketFactory.sol');
const LogicVersionsRegistry = artifacts.require('./base/LogicVersionsRegistry.sol');
const LendingPool = artifacts.require("./base/LendingPool.sol");const LogicVersionsRegistryInterface = artifacts.require("./interfaces/LogicVersionsRegistryInterface.sol");

// ATM Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");
const TLRToken = artifacts.require("./atm/TLRToken.sol");
// External providers
const ChainlinkPairAggregatorRegistry = artifacts.require("./providers/chainlink/ChainlinkPairAggregatorRegistry.sol");

module.exports = async function(deployer, network, accounts) {
  console.log(`Deploying smart contracts to '${network}'.`)
  // Getting network configuration.
  const appConfig = await require('../config')(network);
  const { networkConfig, env } = appConfig;

  // Getting configuration values.
  const deployerAccountIndex = env.getDefaultAddressIndex().getOrDefault();
  const deployerAccount = accounts[deployerAccountIndex];
  console.log(`Deployer account index is ${deployerAccountIndex} => ${deployerAccount}`);
  const { maxGasLimit } = networkConfig;
  assert(maxGasLimit, `Max gas limit for network ${network} is undefined.`);

  const txConfig = { gas: maxGasLimit, from: deployerAccount };

  // Creating DeployerApp helper.
  const deployerApp = new DeployerApp(deployer, web3, deployerAccount, { InitializeableDynamicProxy }, { network, networkConfig });

  const contracts = [
    { Contract: LendingPool, name: logicNames.LendingPool },
    { Contract: LogicVersionsRegistry, name: logicNames.LogicVersionsRegistry },
    { Contract: ATMGovernance, name: logicNames.ATMGovernance },
    { Contract: EscrowFactory, name: logicNames.EscrowFactory },
    { Contract: ChainlinkPairAggregatorRegistry, name: logicNames.ChainlinkPairAggregatorRegistry },
    { Contract: ATMFactory, name: logicNames.ATMFactory },
    { Contract: MarketFactory, name: logicNames.MarketFactory },
    { Contract: Settings, name: logicNames.Settings },
    
    { Contract: TLRToken, name: logicNames.TLRToken },
  ];
  /*
  truffle run verify TLRToken --network ropsten
  Settings
  EscrowFactory
  MarketFactory
  LogicVersionsRegistry
  LendingPool
  ATMFactory
  ATMGovernance
  TLRToken
  ChainlinkPairAggregatorRegistry
  */
  await deployLogicContracts(contracts, { deployerApp, txConfig, web3, LogicVersionsRegistryInterface });

  deployerApp.print();
  deployerApp.writeJson();
  console.log(`${'='.repeat(25)} Deployment process finished. ${'='.repeat(25)}`);
};