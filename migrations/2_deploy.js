const assert = require('assert');
const DeployerApp = require('./utils/DeployerApp');
const PoolDeployer = require('./utils/PoolDeployer');
const initSettings = require('./utils/init_settings');
const initATMs = require('./utils/init_settings/initATMs');

const ERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol");
const AdminUpgradeabilityProxy = artifacts.require("./base/UpgradeableProxy.sol");

// Official Smart Contracts
const TDAI = artifacts.require("./base/TDAI.sol");
const TUSDC = artifacts.require("./base/TUSDC.sol");
const Settings = artifacts.require("./base/Settings.sol");
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");
const MarketsState = artifacts.require("./base/MarketsState.sol");
const Lenders = artifacts.require("./base/Lenders.sol");
const EtherCollateralLoans = artifacts.require("./base/EtherCollateralLoans.sol");
const TokenCollateralLoans = artifacts.require("./base/TokenCollateralLoans.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");
const InterestConsensus = artifacts.require("./base/InterestConsensus.sol");
const LoanTermsConsensus = artifacts.require("./base/LoanTermsConsensus.sol");
// ATM Smart contracts
const ATMGovernanceFactory = artifacts.require("./atm/ATMGovernanceFactory.sol");
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");
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
  const deployerApp = new DeployerApp(deployer, web3, deployerAccount, AdminUpgradeabilityProxy, network);
  const currentBlockNumber = await web3.eth.getBlockNumber();

  await deployerApp.deploys([TDAI, TUSDC], txConfig);
  console.log(`Deployed tokens: TDAI [${TDAI.address}] TUSDC [${TUSDC.address}] `);  

  // ATM Deployments
  await deployerApp.deploy(ATMGovernance, txConfig); // TODO: add Gnosis multisig as signer/pauser (not the DAO for now)

  // Settings Deployments
  await deployerApp.deploy(MarketsState, txConfig);

  const settingsInstance = await deployerApp.deployWithUpgradeable('Settings', Settings, txConfig.from, '0x')
  await settingsInstance.initialize(txConfig.from)
  await initSettings(
    settingsInstance,
    { ...networkConfig, txConfig, network, currentBlockNumber, web3 },
    { ERC20 },
  );

  await deployerApp.deploy(ATMGovernanceFactory, txConfig);
  const atmGovernanceFactoryInstance = await ATMGovernanceFactory.deployed();
  await atmGovernanceFactoryInstance.initialize(settingsInstance.address, txConfig);
  console.log(`ATM Governance Factory deployed at: ${atmGovernanceFactoryInstance.address}`);

  await initATMs(
    { atmFactory: atmGovernanceFactoryInstance },
    { atms, txConfig },
    {},
  );

  await deployerApp.deploy(
    ATMSettings,
    atmGovernanceFactoryInstance.address,
    Settings.address,
    txConfig
  );
  console.log(`ATM settings deployed at: ${ATMSettings.address}`);

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
    console.log(`New aggregator (Inversed? ${inversed}) for ${chainlinkOraclePair} (Collateral Decimals: ${collateralDecimals} / Response Decimals: ${responseDecimals}): ${ChainlinkPairAggregator.address} (using Chainlink Oracle address ${address})`);
    aggregators[chainlinkOraclePair] = ChainlinkPairAggregator.address;
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
    Settings,
  };
  const poolDeployer = new PoolDeployer(deployerApp, deployConfig, artifacts);

  const InterestValidator = undefined; // The first version will be undefined (or 0x0).

  await poolDeployer.deployPool(
    { tokenName: 'DAI', collateralName: 'ETH' },
    {
      Loans: EtherCollateralLoans,
      TToken: TDAI,
      MarketsState,
      InterestValidator,
      ATMSettings,
    },
    txConfig
  );
  await poolDeployer.deployPool(
    { tokenName: 'USDC', collateralName: 'ETH' },
    {
      Loans: EtherCollateralLoans,
      TToken: TUSDC,
      MarketsState,
      InterestValidator,
      ATMSettings,
    },
    txConfig
  );

  await poolDeployer.deployPool(
    { tokenName: 'DAI', collateralName: 'LINK', aggregatorName: 'LINK_USD' },
    {
      Loans: TokenCollateralLoans,
      TToken: TDAI,
      MarketsState,
      InterestValidator,
      ATMSettings,
    },
    txConfig
  );
  await poolDeployer.deployPool(
    { tokenName: 'USDC', collateralName: 'LINK', aggregatorName: 'LINK_USD' },
    {
      Loans: TokenCollateralLoans,
      TToken: TUSDC,
      MarketsState,
      InterestValidator,
      ATMSettings,
    },
    txConfig
  );

  deployerApp.print();
  deployerApp.writeJson();
  console.log(`${'='.repeat(25)} Deployment process finished. ${'='.repeat(25)}`);
};