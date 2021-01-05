const assert = require('assert');
const logicNames = require('../test/utils/logicNames');
const DeployerApp = require('./utils/DeployerApp');
const initSettings = require('./utils/init_settings');
const initATMs = require('./utils/init_settings/initATMs');
const initLogicVersions = require('./utils/init_settings/initLogicVersions');
const deployLogicContracts = require('./utils/init_settings/deployLogicContracts');
const { NULL_ADDRESS, toBytes32 } = require('../test/utils/consts');
const initPairAggregators = require('./utils/init_settings/initPairAggregators');
const createMarkets = require('./utils/init_settings/createMarkets');

const ERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol");
const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");
const InitializeableDynamicProxy = artifacts.require("./base/InitializeableDynamicProxy.sol");
const DynamicProxy = artifacts.require("./base/DynamicProxy.sol");
const Mock = artifacts.require("./mock/util/Mock.sol");

const ERC20Mintable = artifacts.require('@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol');

// Official Smart Contracts
const TDAI = artifacts.require("./base/TDAI.sol");
const TUSDC = artifacts.require("./base/TUSDC.sol");
const TTokenRegistry = artifacts.require("./base/TTokenRegistry.sol");
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
const Uniswap = artifacts.require("./base/escrow/dapps/Uniswap.sol");
const Compound = artifacts.require("./base/escrow/dapps/Compound.sol");
// ATM Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");
const ATMLiquidityMining = artifacts.require("./atm/ATMLiquidityMining.sol");
const TLRToken = artifacts.require("./atm/TLRToken.sol");
// External providers
const ChainlinkAggregator = artifacts.require("./providers/chainlink/ChainlinkAggregator.sol");
const tokensRequired = ['DAI', 'USDC', 'LINK'];
// Libraries
const LoanLib = artifacts.require("./utils/LoanLib.sol");

module.exports = async function(deployer, network, accounts) {
  if (network === 'test') return

  console.log(`Deploying smart contracts to '${network}'.`)
  // Getting network configuration.
  const appConfig = await require('../config')(network);
  const { networkConfig, env } = appConfig;

  // Getting configuration values.
  const deployerAccountIndex = env.getDefaultAddressIndex().getOrDefault();
  const deployerAccount = accounts[deployerAccountIndex];
  console.log(`Deployer account index is ${deployerAccountIndex} => ${deployerAccount}`);
  const { maxGasLimit, tokens, atms, compound } = networkConfig;
  assert(compound.CETH, `Compound CETH address not found for network ${network}.`);
  assert(maxGasLimit, `Max gas limit for network ${network} is undefined.`);

  // Validations
  tokensRequired.forEach( tokenName => assert(tokens[tokenName], `${tokenName} token address is not defined.`));

  const txConfig = { gas: maxGasLimit, from: deployerAccount };

  // Creating DeployerApp helper.
  const deployerApp = new DeployerApp(deployer, web3, deployerAccount, { InitializeableDynamicProxy, Mock }, { network, networkConfig });
  try {
    await deployerApp.deployMocksContractsIfNeeded();
    const currentBlockNumber = await web3.eth.getBlockNumber();

    console.log(`Deployment starts at block number: ${currentBlockNumber}`);

    const contracts = [
      // Logic
      { Contract: LendingPool, name: logicNames.LendingPool },
      { Contract: Lenders, name: logicNames.Lenders },
      { Contract: TokenCollateralLoans, name: logicNames.TokenCollateralLoans },
      { Contract: EtherCollateralLoans, name: logicNames.EtherCollateralLoans },
      { Contract: LoanTermsConsensus, name: logicNames.LoanTermsConsensus },
      { Contract: InterestConsensus, name: logicNames.InterestConsensus },
      { Contract: Escrow, name: logicNames.Escrow },
      { Contract: ChainlinkAggregator, name: logicNames.ChainlinkAggregator },
      { Contract: ATMGovernance, name: logicNames.ATMGovernance },
      { Contract: ATMLiquidityMining, name: logicNames.ATMLiquidityMining },
      { Contract: TLRToken, name: logicNames.TLRToken },
      // Dapps
      { Contract: Uniswap, name: logicNames.Uniswap },
      { Contract: Compound, name: logicNames.Compound },
      // Initializables
      { Contract: EscrowFactory, name: logicNames.EscrowFactory },
      { Contract: MarketsState, name: logicNames.MarketsState },
      { Contract: ATMSettings, name: logicNames.ATMSettings },
      { Contract: ATMFactory, name: logicNames.ATMFactory },
      { Contract: ATMLiquidityMining, name: logicNames.ATMLiquidityMining },
      { Contract: MarketFactory, name: logicNames.MarketFactory },
      { Contract: TTokenRegistry, name : logicNames.TTokenRegistry },
    ];

    const loanLib = await LoanLib.new();
    await TokenCollateralLoans.link("LoanLib", loanLib.address);
    await EtherCollateralLoans.link("LoanLib", loanLib.address);

    const deployedLogicContractsMap = await deployLogicContracts(contracts, { deployerApp, txConfig, web3 });

    async function deployInitializableDynamicProxy(name) {
      const info = deployedLogicContractsMap.get(name)
      assert(info, `Deployed logic info is undefined for logic name ${name}.`)
      const proxy = await deployerApp.deployInitializeableDynamicProxy(info, txConfig)
      return info.Contract.at(proxy.address)
    }

    console.log(`Deploying Settings logic...`)
    const settingsLogic = await deployerApp.deployWith('Settings', Settings, 'teller', txConfig)
    const settingsProxy = await deployerApp.deployWith('Settings_Proxy', UpgradeableProxy, 'teller', txConfig)
    await settingsProxy.initializeProxy(
      settingsProxy.address,
      settingsLogic.address,
      txConfig
    )
    const settingsInstance = await Settings.at(settingsProxy.address)
    console.log(`Settings logic: ${settingsLogic.address}`)
    console.log(`Settings_Proxy: ${settingsProxy.address}`)

    const escrowFactoryInstance = await deployInitializableDynamicProxy(logicNames.EscrowFactory)
    const chainlinkAggregatorInstance = await deployInitializableDynamicProxy(logicNames.ChainlinkAggregator)
    const marketsStateInstance = await deployInitializableDynamicProxy(logicNames.MarketsState)
    const atmSettingsInstance = await deployInitializableDynamicProxy(logicNames.ATMSettings)
    const atmFactoryInstance = await deployInitializableDynamicProxy(logicNames.ATMFactory)
    const marketFactoryInstance = await deployInitializableDynamicProxy(logicNames.MarketFactory)
    const tTokenRegistryInstance = await deployInitializableDynamicProxy(logicNames.TTokenRegistry)

    console.log(`Deploying LogicVersionsRegistry...`)
    const logicVersionsRegistryLogic = await deployerApp.deployWith('LogicVersionsRegistry', LogicVersionsRegistry, 'teller', txConfig)
    const logicVersionsRegistryProxy = await deployerApp.deployWith('LogicVersionsRegistry_Proxy', UpgradeableProxy, 'teller', txConfig)
    await logicVersionsRegistryProxy.initializeProxy(
      settingsInstance.address,
      logicVersionsRegistryLogic.address,
      txConfig
    )
    const logicVersionsRegistryInstance = await LogicVersionsRegistry.at(logicVersionsRegistryProxy.address)
    await logicVersionsRegistryInstance.initialize(settingsInstance.address)
    console.log(`LogicVersionsRegistry logic: ${logicVersionsRegistryLogic.address}`)
    console.log(`LogicVersionsRegistry_Proxy: ${logicVersionsRegistryProxy.address}`)

    console.log(`Settings: Initializing...`);
    await settingsInstance.initialize(
      escrowFactoryInstance.address,
      logicVersionsRegistryInstance.address,
      chainlinkAggregatorInstance.address,
      marketsStateInstance.address,
      NULL_ADDRESS, // Interest Validator is empty (0x0) in the first version.
      atmSettingsInstance.address,
      tokens.WETH,
      compound.CETH
    );

    await initLogicVersions(
      deployedLogicContractsMap,
      { logicVersionsRegistryInstance },
      { txConfig },
    );

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

    async function initializeProxy(name, instance) {
      const logicContractInfo = deployedLogicContractsMap.get(name)
      assert(logicContractInfo.nameBytes32, `Name bytes32 is undefined for logic name ${name}.`);
      const { nameBytes32 } = logicContractInfo;
      const proxy = await InitializeableDynamicProxy.at(instance.address)
      await proxy.initializeProxy(settingsInstance.address, nameBytes32)
      await instance.initialize(settingsInstance.address)
    }

    await initializeProxy(logicNames.EscrowFactory, escrowFactoryInstance)
    await initializeProxy(logicNames.ChainlinkAggregator, chainlinkAggregatorInstance)
    await initializeProxy(logicNames.MarketsState, marketsStateInstance)
    await initializeProxy(logicNames.ATMSettings, atmSettingsInstance)
    await initializeProxy(logicNames.ATMFactory, atmFactoryInstance)
    await initializeProxy(logicNames.MarketFactory, marketFactoryInstance)
    await initializeProxy(logicNames.TTokenRegistry, tTokenRegistryInstance)

    async function deployDapp(name, unsecured) {
      const info = deployedLogicContractsMap.get(name)
      assert(info, `Deployed logic info is undefined for logic name ${name}.`)
      const proxy = await deployerApp.deployWith(`${info.name}_Proxy`, DynamicProxy, 'teller', settingsInstance.address, toBytes32(web3, name), txConfig)

      // Register dapp
      await escrowFactoryInstance.addDapp(proxy.address, unsecured)

      return info.Contract.at(proxy.address)
    }

    await deployDapp(logicNames.Uniswap, false)
    await deployDapp(logicNames.Compound, true)

    await initATMs(
      { atmFactory: atmFactoryInstance, atmSettings: atmSettingsInstance },
      { atms, tokens, txConfig, web3 },
      { ATMGovernance },
    );

    await initPairAggregators(
      { chainlinkAggregatorInstance },
      { txConfig, ...networkConfig },
    );

    await deployerApp.deploys([TDAI, TUSDC], settingsInstance.address, txConfig);
    console.log(`Deployed tokens: TDAI [${TDAI.address}] TUSDC [${TUSDC.address}] `);
    console.log(`Registering TDAI and TUSDC in TTokenRegistry`);
    await tTokenRegistryInstance.registerTToken(TDAI.address, txConfig);
    await tTokenRegistryInstance.registerTToken(TUSDC.address, txConfig);
    console.log(`TDAI [${TDAI.address}] and TUSDC [${TUSDC.address}] added to TTokenRegistry`);
    console.log(`Creating Markets...`);
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
  } catch (error) {
    console.log('\x1b[33m\x1b[41m\x1b[5m', `Error deploying contract`, '\x1b[0m');
    console.log(error);
    deployerApp.print();
    deployerApp.writeJson();
    console.log('\x1b[33m\x1b[41m\x1b[5m%s\x1b[0m', `${'='.repeat(25)} Deployment process FAILED. ${'='.repeat(25)}`);
  }
};
