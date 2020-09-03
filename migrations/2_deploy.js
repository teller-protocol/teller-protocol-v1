const assert = require('assert');
const logicNames = require('../test/utils/logicNames');
const DeployerApp = require('./utils/DeployerApp');
const initSettings = require('./utils/init_settings');
const initATMs = require('./utils/init_settings/initATMs');
const initLogicVersions = require('./utils/init_settings/initLogicVersions');
const deployLogicContracts = require('./utils/init_settings/deployLogicContracts');
const { NULL_ADDRESS } = require('../test/utils/consts');
const initPairAggregators = require('./utils/init_settings/initPairAggregators');
const createMarkets = require('./utils/init_settings/createMarkets');

const ERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol");
const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");
const InitializeableDynamicProxy = artifacts.require("./base/InitializeableDynamicProxy.sol");
const Mock = artifacts.require("./mock/util/Mock.sol");

const ERC20Mintable = artifacts.require('@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol');

// Official Smart Contracts
const TDAI = artifacts.require("./base/TDAI.sol");
const TUSDC = artifacts.require("./base/TUSDC.sol");
const Settings = artifacts.require("./base/Settings.sol");
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");
const MarketsState = artifacts.require("./base/MarketsState.sol");
const EscrowFactory = artifacts.require('./base/EscrowFactory.sol');
const MarketFactory = artifacts.require('./base/MarketFactory.sol');
const LogicVersionsRegistry = artifacts.require('./base/LogicVersionsRegistry.sol');
const Escrow = artifacts.require('./base/Escrow.sol');
const Lenders = artifacts.require("./base/Lenders.sol");
const EtherCollateralLoans = artifacts.require("./base/EtherCollateralLoans.sol");
const TokenCollateralLoans = artifacts.require("./base/TokenCollateralLoans.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");
const InterestConsensus = artifacts.require("./base/InterestConsensus.sol");
const LoanTermsConsensus = artifacts.require("./base/LoanTermsConsensus.sol");
// ATM Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");
const TLRToken = artifacts.require("./atm/TLRToken.sol");
// External providers
const ChainlinkPairAggregatorRegistry = artifacts.require("./providers/chainlink/ChainlinkPairAggregatorRegistry.sol");
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");
const tokensRequired = ['DAI', 'USDC', 'LINK'];

module.exports = async function(deployer, network, accounts) {
  console.log(`Deploying smart contracts to '${network}'.`)
  // Getting network configuration.
  const appConfig = await require('../config')(network);
  const { networkConfig, env } = appConfig;

  // Getting configuration values.
  const deployerAccountIndex = env.getDefaultAddressIndex().getOrDefault();
  const deployerAccount = accounts[deployerAccountIndex];
  console.log(`Deployer account index is ${deployerAccountIndex} => ${deployerAccount}`);
  const { maxGasLimit, tokens, chainlink, signers, compound, atms } = networkConfig;
  assert(maxGasLimit, `Max gas limit for network ${network} is undefined.`);

  // Validations
  tokensRequired.forEach( tokenName => assert(tokens[tokenName], `${tokenName} token address is not defined.`));

  const txConfig = { gas: maxGasLimit, from: deployerAccount };

  // Creating DeployerApp helper.
  const deployerApp = new DeployerApp(deployer, web3, deployerAccount, { InitializeableDynamicProxy, Mock }, { network, networkConfig });
  
  await deployerApp.deployMocksContractsIfNeeded();
  const currentBlockNumber = await web3.eth.getBlockNumber();

  const contracts = [
    // Logic
    { Contract: LendingPool, name: logicNames.LendingPool },
    { Contract: Lenders, name: logicNames.Lenders },
    { Contract: TokenCollateralLoans, name: logicNames.TokenCollateralLoans },
    { Contract: EtherCollateralLoans, name: logicNames.EtherCollateralLoans },
    { Contract: LoanTermsConsensus, name: logicNames.LoanTermsConsensus },
    { Contract: InterestConsensus, name: logicNames.InterestConsensus },
    { Contract: Escrow, name: logicNames.Escrow },
    { Contract: ChainlinkPairAggregator, name: logicNames.ChainlinkPairAggregator },
    { Contract: ATMGovernance, name: logicNames.ATMGovernance },
    { Contract: TLRToken, name: logicNames.TLRToken },
    // Initializables
    { Contract: EscrowFactory, name: logicNames.EscrowFactory },
    { Contract: ChainlinkPairAggregatorRegistry, name: logicNames.ChainlinkPairAggregatorRegistry },
    { Contract: MarketsState, name: logicNames.MarketsState },
    { Contract: ATMSettings, name: logicNames.ATMSettings },
    { Contract: ATMFactory, name: logicNames.ATMFactory },
    { Contract: MarketFactory, name: logicNames.MarketFactory },
  ];

  const deployedLogicContractsMap = await deployLogicContracts(contracts, { deployerApp, txConfig, web3 });

  async function deployInitializableDynamicProxy(name) {
    const info = deployedLogicContractsMap.get(name)
    assert(info, `Deployed logic info is undefined for logic name ${name}.`)
    const proxy = await deployerApp.deployInitializeableDynamicProxy(info, txConfig)
    return info.Contract.at(proxy.address)
  }

  console.log(`Deploying Settings logic...`)
  const settingsLogic = await deployerApp.deployWith('Settings', Settings, txConfig)
  const settingsProxy = await deployerApp.deployWith('Settings_Proxy', UpgradeableProxy, txConfig)
  await settingsProxy.initializeProxy(
    settingsProxy.address,
    settingsLogic.address,
    txConfig
  )
  const settingsInstance = await Settings.at(settingsProxy.address)
  console.log(`Settings logic: ${settingsLogic.address}`)
  console.log(`Settings_Proxy: ${settingsProxy.address}`)

  const escrowFactoryInstance = await deployInitializableDynamicProxy(logicNames.EscrowFactory)
  const pairAggregatorRegistryInstance = await deployInitializableDynamicProxy(logicNames.ChainlinkPairAggregatorRegistry)
  const marketsStateInstance = await deployInitializableDynamicProxy(logicNames.MarketsState)
  const atmSettingsInstance = await deployInitializableDynamicProxy(logicNames.ATMSettings)
  const atmFactoryInstance = await deployInitializableDynamicProxy(logicNames.ATMFactory)
  const marketFactoryInstance = await deployInitializableDynamicProxy(logicNames.MarketFactory)

  console.log(`Deploying LogicVersionsRegistry...`)
  const logicVersionsRegistryLogic = await deployerApp.deployWith('LogicVersionsRegistry', LogicVersionsRegistry, txConfig)
  const logicVersionsRegistryProxy = await deployerApp.deployWith('LogicVersionsRegistry_Proxy', UpgradeableProxy, txConfig)
  await logicVersionsRegistryProxy.initializeProxy(
    settingsInstance.address,
    logicVersionsRegistryLogic.address,
    txConfig
  )
  const logicVersionsRegistryInstance = await LogicVersionsRegistry.at(logicVersionsRegistryProxy.address)
  await logicVersionsRegistryInstance.initialize(settingsInstance.address)
  console.log(`LogicVersionsRegistry logic: ${logicVersionsRegistryLogic.address}`)
  console.log(`LogicVersionsRegistry_Proxy: ${logicVersionsRegistryLogic.address}`)

  console.log(`Settings: Initializing...`);
  await settingsInstance.initialize(
    escrowFactoryInstance.address,
    logicVersionsRegistryInstance.address,
    pairAggregatorRegistryInstance.address,
    marketsStateInstance.address,
    NULL_ADDRESS, // Interest Validator is empty (0x0) in the first version.
    atmSettingsInstance.address,
  );

  await initLogicVersions(
    deployedLogicContractsMap,
    { logicVersionsRegistryInstance },
    { txConfig },
  );

  async function initializeProxy(name, instance) {
    const logicContractInfo = deployedLogicContractsMap.get(name)
    assert(logicContractInfo.nameBytes32, `Name bytes32 is undefined for logic name ${name}.`);
    const { nameBytes32 } = logicContractInfo;
    const proxy = await InitializeableDynamicProxy.at(instance.address)
    await proxy.initializeProxy(settingsInstance.address, nameBytes32)
    await instance.initialize(settingsInstance.address)
  }

  await initializeProxy(logicNames.EscrowFactory, escrowFactoryInstance)
  await initializeProxy(logicNames.ChainlinkPairAggregatorRegistry, pairAggregatorRegistryInstance)
  await initializeProxy(logicNames.MarketsState, marketsStateInstance)
  await initializeProxy(logicNames.ATMSettings, atmSettingsInstance)
  await initializeProxy(logicNames.ATMFactory, atmFactoryInstance)
  await initializeProxy(logicNames.MarketFactory, marketFactoryInstance)

  await initSettings(
    settingsInstance,
    {
      ...networkConfig,
      txConfig,
      network,
      currentBlockNumber,
      web3
    },
    { ERC20 },
  );

  await initATMs(
    { atmFactory: atmFactoryInstance, atmSettings: atmSettingsInstance },
    { atms, tokens, txConfig, web3 },
    { ATMGovernance },
  );

  await initPairAggregators(
    { pairAggregatorRegistryInstance },
    { txConfig, ...networkConfig },
  );

  await deployerApp.deploys([TDAI, TUSDC], txConfig);
  console.log(`Deployed tokens: TDAI [${TDAI.address}] TUSDC [${TUSDC.address}] `);
  const marketDefinitions = [
    { tTokenAddress: TDAI.address, borrowedTokenName: 'DAI', collateralTokenName: 'ETH' },
    { tTokenAddress: TDAI.address, borrowedTokenName: 'DAI', collateralTokenName: 'LINK' },
    { tTokenAddress: TUSDC.address, borrowedTokenName: 'USDC', collateralTokenName: 'ETH' },
    { tTokenAddress: TUSDC.address, borrowedTokenName: 'USDC', collateralTokenName: 'LINK' },
  ];

  await createMarkets(
    marketDefinitions,
    { marketFactoryInstance, marketsStateInstance },
    { txConfig, deployerApp, ...networkConfig },
    { LoanTermsConsensus, InterestConsensus, ERC20Mintable }
  );

  deployerApp.print();
  deployerApp.writeJson();
  console.log(`${'='.repeat(25)} Deployment process finished. ${'='.repeat(25)}`);
};