const assert = require('assert');
const DeployerApp = require('./utils/DeployerApp');
const PoolDeployer = require('./utils/PoolDeployer');
const initSettings = require('./utils/init_settings');
const initATMs = require('./utils/init_settings/initATMs');

const ERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol");
const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");

// Official Smart Contracts
const TDAI = artifacts.require("./base/TDAI.sol");
const TUSDC = artifacts.require("./base/TUSDC.sol");
const Settings = artifacts.require("./base/Settings.sol");
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");
const MarketsState = artifacts.require("./base/MarketsState.sol");
const EscrowFactory = artifacts.require('./base/EscrowFactory.sol');
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
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");
const InverseChainlinkPairAggregator = artifacts.require("./providers/chainlink/InverseChainlinkPairAggregator.sol");

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
  chainlinkOraclesRequired.forEach( pairName => assert(chainlink[pairName], `Chainlink: ${pairName} oracle address is undefined.`));

  const txConfig = { gas: maxGasLimit, from: deployerAccount };

  // Creating DeployerApp helper.
  const deployerApp = new DeployerApp(deployer, web3, deployerAccount, UpgradeableProxy, network);
  const currentBlockNumber = await web3.eth.getBlockNumber();

  await deployerApp.deploys([TDAI, TUSDC], txConfig);
  console.log(`Deployed tokens: TDAI [${TDAI.address}] TUSDC [${TUSDC.address}] `);  

  await deployerApp.deploy(Escrow, txConfig);
  console.log(`Escrow contract address deployed at: ${Escrow.address}.`);
  const escrowFactoryInstance = await deployerApp.deployWithUpgradeable('EscrowFactory', EscrowFactory, txConfig.from, '0x');

  // Settings Deployments
  await deployerApp.deploy(MarketsState, txConfig);
  const marketsStateInstance = await MarketsState.deployed();

  const settingsInstance = await deployerApp.deployWithUpgradeable('Settings', Settings, txConfig.from, '0x');
  await settingsInstance.initialize(txConfig.from);
  await initSettings(
    settingsInstance,
    {
      ...networkConfig,
      escrowFactory: escrowFactoryInstance,
      txConfig,
      network,
      currentBlockNumber,
      web3 
    },
    { ERC20 },
  );

  console.log(`EscrowFactory: Initializing...`);
  await escrowFactoryInstance.initialize(settingsInstance.address, Escrow.address, txConfig);

  await deployerApp.deploy(
    ATMSettings,
    settingsInstance.address,
    txConfig
  );
  const atmSettingsInstance = await ATMSettings.deployed();
  console.log(`ATM settings deployed at: ${atmSettingsInstance.address}`);

  const atmFactoryInstance = await deployerApp.deployWithUpgradeable('ATMFactory', ATMFactory, txConfig.from, '0x')
  await atmFactoryInstance.initialize(
    settingsInstance.address,
    atmSettingsInstance.address,
    txConfig
  );
  console.log(`ATM Governance Factory (Proxy) deployed at: ${atmFactoryInstance.address}`);

  await initATMs(
    { atmFactory: atmFactoryInstance, atmSettings: atmSettingsInstance },
    { atms, tokens, txConfig, web3, deployerApp },
    { ATMGovernance, ATMToken },
  );

  const aggregators = {};
  
  for (const chainlinkOraclePair of chainlinkOraclesRequired) {
    const chainlinkOracleInfo = chainlink[chainlinkOraclePair];
    const {
      address,
      collateralDecimals,
      responseDecimals,
      inversed,
    } = chainlinkOracleInfo;

    const ChainlinkPairAggregatorReference = inversed ? InverseChainlinkPairAggregator : ChainlinkPairAggregator;
    let chainlinkPairAggregatorName =  `ChainlinkPairAggregator_${chainlinkOraclePair.toUpperCase()}`;
    if(inversed) {
      const pairs = chainlinkOraclePair.split('_');
      chainlinkPairAggregatorName =  `ChainlinkPairAggregator_${pairs[1].toUpperCase()}_${pairs[0]}`;
    }
    await deployerApp.deployWith(
      chainlinkPairAggregatorName,
      ChainlinkPairAggregatorReference,
      address,
      responseDecimals,
      collateralDecimals,
      txConfig
    );
    console.log(`New aggregator (Inversed? ${inversed}) for ${chainlinkOraclePair} (Collateral Decimals: ${collateralDecimals} / Response Decimals: ${responseDecimals}): ${ChainlinkPairAggregatorReference.address} (using Chainlink Oracle address ${address})`);
    aggregators[chainlinkOraclePair] = ChainlinkPairAggregatorReference.address;
  }

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
    marketsStateInstance,
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

  deployerApp.print();
  deployerApp.writeJson();
  console.log(`${'='.repeat(25)} Deployment process finished. ${'='.repeat(25)}`);
};