const assert = require('assert');
const logicNames = require('../test/utils/logicNames');
const DeployerApp = require('./utils/DeployerApp');
const PoolDeployer = require('./utils/PoolDeployer');
const initSettings = require('./utils/init_settings');
const initATMs = require('./utils/init_settings/initATMs');
const initLogicVersions = require('./utils/init_settings/initLogicVersions');
const deployLogicContracts = require('./utils/init_settings/deployLogicContracts');
const { NULL_ADDRESS } = require('../test/utils/consts');
const initPairAggregators = require('./utils/init_settings/initPairAggregators');
const createMarkets = require('./utils/init_settings/createMarkets');

const ERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol");
const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");

// Official Smart Contracts
const TDAI = artifacts.require("./base/TDAI.sol");
const TUSDC = artifacts.require("./base/TUSDC.sol");
const Settings = artifacts.require("./base/Settings.sol");
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");
const MarketsState = artifacts.require("./base/MarketsState.sol");
const EscrowFactory = artifacts.require('./base/EscrowFactory.sol');
const MarketFactory = artifacts.require('./base/MarketFactory.sol');
const LogicVersionsRegistry = artifacts.require('./base/LogicVersionsRegistry.sol');
const IERC20Mintable = artifacts.require('./providers/openzeppelin/IERC20Mintable.sol');
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
const ATMToken = artifacts.require("./atm/ATMToken.sol");
// External providers
const ChainlinkPairAggregatorRegistry = artifacts.require("./providers/chainlink/ChainlinkPairAggregatorRegistry.sol");
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");
const tokensRequired = ['DAI', 'USDC', 'LINK'];
const chainlinkOraclesRequired = ['DAI_ETH', 'USDC_ETH', 'LINK_USD'];

module.exports = async function(deployer, network, accounts) {
  console.log(`Deploying smart contracts to '${network}'.`)
  // Getting network configuration.
  const appConfig = require('../config')(network);
  const { networkConfig, env } = appConfig;

  // Getting configuration values.
  const deployerAccountIndex = env.getDefaultAddressIndex().getOrDefault();
  const deployerAccount = accounts[deployerAccountIndex];
  console.log(`Deployer account index is ${deployerAccountIndex} => ${deployerAccount}`);
  const { maxGasLimit, tokens, chainlink, signers, compound, atms } = networkConfig;
  assert(maxGasLimit, `Max gas limit for network ${network} is undefined.`);

  // Validations
  tokensRequired.forEach( tokenName => assert(tokens[tokenName], `${tokenName} token address is not defined.`));
  // TODO Review chainlinkOraclesRequired.forEach( pairName => assert(chainlink[pairName], `Chainlink: ${pairName} oracle address is undefined.`));

  const txConfig = { gas: maxGasLimit, from: deployerAccount };

  // Creating DeployerApp helper.
  const deployerApp = new DeployerApp(deployer, web3, deployerAccount, UpgradeableProxy, network);
  const currentBlockNumber = await web3.eth.getBlockNumber();

  const contracts = [
    // Logic
    { isLogic: true, Contract: LendingPool, name: logicNames.LendingPool },
    { isLogic: true, Contract: Lenders, name: logicNames.Lenders },
    { isLogic: true, Contract: TokenCollateralLoans, name: logicNames.TokenCollateralLoans },
    { isLogic: true, Contract: EtherCollateralLoans, name: logicNames.EtherCollateralLoans },
    { isLogic: true, Contract: LoanTermsConsensus, name: logicNames.LoanTermsConsensus },
    { isLogic: true, Contract: InterestConsensus, name: logicNames.InterestConsensus },
    { isLogic: true, Contract: Escrow, name: logicNames.Escrow },
    { isLogic: true, Contract: ChainlinkPairAggregator, name: logicNames.ChainlinkPairAggregator },
    { isLogic: true, Contract: ATMGovernance, name: logicNames.ATMGovernance },
    { isLogic: true, Contract: ATMToken, name: logicNames.ATMToken },
    // Initializables
    { isLogic: false, Contract: Settings, name: logicNames.Settings },
    { isLogic: false, Contract: LogicVersionsRegistry, name: logicNames.LogicVersionsRegistry },
    { isLogic: false, Contract: ChainlinkPairAggregatorRegistry, name: logicNames.ChainlinkPairAggregatorRegistry },
    { isLogic: false, Contract: EscrowFactory, name: logicNames.EscrowFactory },
    { isLogic: false, Contract: MarketsState, name: logicNames.MarketsState },
    { isLogic: false, Contract: ATMSettings, name: logicNames.ATMSettings },
    { isLogic: false, Contract: ATMFactory, name: logicNames.ATMFactory },
    { isLogic: false, Contract: MarketFactory, name: logicNames.MarketFactory },
  ];

  const logicContracts = contracts.filter( contract => contract.isLogic);
  const deployedLogicContractsMap = await deployLogicContracts(logicContracts, { deployerApp, txConfig, web3 });
  // TODO Register the contracts (isLogic=false) in the logicVersionsRegistry.
  const settingsInstance = await deployerApp.deployProxyFor(
    logicNames.Settings,
    Settings,
    txConfig.from,
    undefined,
    txConfig,
  );
  const logicVersionsRegistryInstance = await deployerApp.deployProxyFor(
    logicNames.LogicVersionsRegistry,
    LogicVersionsRegistry,
    txConfig.from,
    [settingsInstance.address],
    txConfig,
  );
  const pairAggregatorRegistryInstance = await deployerApp.deployProxyFor(
    logicNames.ChainlinkPairAggregatorRegistry,
    ChainlinkPairAggregatorRegistry,
    txConfig.from,
    [settingsInstance.address],
    txConfig,
  );
  const escrowFactoryInstance = await deployerApp.deployProxyFor(
    logicNames.EscrowFactory,
    EscrowFactory,
    txConfig.from,
    [settingsInstance.address],
    txConfig,
  );
  const marketsStateInstance = await deployerApp.deployProxyFor(
    logicNames.MarketsState,
    MarketsState,
    txConfig.from,
    [settingsInstance.address],
    txConfig,
  );
  const atmSettingsInstance = await deployerApp.deployProxyFor(
    logicNames.ATMSettings,
    ATMSettings,
    txConfig.from,
    [settingsInstance.address],
    txConfig,
  );
  const atmFactoryInstance = await deployerApp.deployProxyFor(
    logicNames.ATMFactory,
    ATMFactory,
    txConfig.from,
    [settingsInstance.address],
    txConfig,
  );
  const marketFactoryInstance = await deployerApp.deployProxyFor(
    logicNames.MarketFactory,
    MarketFactory,
    txConfig.from,
    [settingsInstance.address],
    txConfig,
  );
  console.log(`Settings_Proxy: Initializing...`);
  await settingsInstance.initialize(
    escrowFactoryInstance.address,
    logicVersionsRegistryInstance.address,
    pairAggregatorRegistryInstance.address,
    marketsStateInstance.address,
    NULL_ADDRESS, // Interest Validator is empty (0x0) in the first version.
    atmSettingsInstance.address,
    //txConfig,
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
  
  await initLogicVersions(
    deployedLogicContractsMap,
    { logicVersionsRegistryInstance },
    { txConfig },
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
    { txConfig, ...networkConfig },
    { LoanTermsConsensus, InterestConsensus, IERC20Mintable }
  );
/*

  const deployConfig = {
    tokens,
    aggregators,
    signers,
    cTokens: compound,
  };

  const artifacts = {
    Lenders,
    LendingPool,
    InterestConsensus,
    LoanTermsConsensus,
  };
  const poolDeployer = new PoolDeployer(deployerApp, deployConfig, artifacts);

  const instances = {
    marketsStateInstance2,
    settingsInstance,
    atmSettingsInstance,
    interestValidatorInstance: undefined, // The first version will be undefined (or 0x0).
  };
  await poolDeployer.deployPool(
    { tokenName: 'DAI', collateralName: 'ETH' },
    {
      Loans: EtherCollateralLoans,
      TToken: TDAI,
    },
    instances,
    txConfig
  );
  await poolDeployer.deployPool(
    { tokenName: 'USDC', collateralName: 'ETH' },
    {
      Loans: EtherCollateralLoans,
      TToken: TUSDC,
    },
    instances,
    txConfig
  );

  await poolDeployer.deployPool(
    { tokenName: 'DAI', collateralName: 'LINK', aggregatorName: 'LINK_USD' },
    {
      Loans: TokenCollateralLoans,
      TToken: TDAI,
    },
    instances,
    txConfig
  );
  await poolDeployer.deployPool(
    { tokenName: 'USDC', collateralName: 'LINK', aggregatorName: 'LINK_USD' },
    {
      Loans: TokenCollateralLoans,
      TToken: TUSDC,
    },
    instances,
    txConfig
  );
*/
  deployerApp.print();
  deployerApp.writeJson();
  console.log(`${'='.repeat(25)} Deployment process finished. ${'='.repeat(25)}`);
};