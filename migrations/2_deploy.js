const assert = require('assert');
const DeployerApp = require('./utils/DeployerApp');
const PoolDeployer = require('./utils/PoolDeployer');

// Official Smart Contracts
const ZDAI = artifacts.require("./base/ZDAI.sol");
const ZUSDC = artifacts.require("./base/ZUSDC.sol");
const Settings = artifacts.require("./base/Settings.sol");
const Lenders = artifacts.require("./base/Lenders.sol");
const EtherLoans = artifacts.require("./base/EtherLoans.sol");
const TokenLoans = artifacts.require("./base/TokenLoans.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");
const InterestConsensus = artifacts.require("./base/InterestConsensus.sol");
const LoanTermsConsensus = artifacts.require("./base/LoanTermsConsensus.sol");
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");

const tokensRequired = ['DAI', 'USDC', 'LINK'];
const chainlinkOraclesRequired = ['DAI_ETH', 'USDC_ETH', 'USD_LINK'];

module.exports = async function(deployer, network, accounts) {
  console.log(`Deploying smart contracts to '${network}'.`)
  // Getting network configuration.
  const appConfig = require('../config')(network);
  const { networkConfig, env } = appConfig;

  // Getting configuration values.
  const requiredSubmissions = env.getDefaultRequiredSubmissions().getOrDefault();
  const maximumTolerance = env.getDefaultMaximumTolerance().getOrDefault();
  const responseExpiry = env.getDefaultResponseExpiry().getOrDefault();
  const safetyInterval = env.getDefaultSafetyInterval().getOrDefault();
  const liquidateEthPrice = env.getDefaultLiquidateEthPrice().getOrDefault();
  const termsExpiryTime = env.getDefaultTermsExpiryTime().getOrDefault();
  const deployerAccountIndex = env.getDefaultAddressIndex().getOrDefault();
  const deployerAccount = accounts[deployerAccountIndex];
  console.log(`Deployer account index is ${deployerAccountIndex} => ${deployerAccount}`);
  const { maxGasLimit, tokens, chainlink } = networkConfig;
  assert(maxGasLimit, `Max gas limit for network ${network} is undefined.`);

  // Validations
  tokensRequired.forEach( tokenName => assert(tokens[tokenName], `${tokenName} token address is not defined.`));
  chainlinkOraclesRequired.forEach( pairName => assert(chainlink[pairName], `Chainlink: ${pairName} oracle address is undefined.`));

  const txConfig = { gas: maxGasLimit, from: deployerAccount };

  // Creating DeployerApp helper.
  const deployerApp = new DeployerApp(deployer, web3, deployerAccount, network);
  
  await deployerApp.deploys([ZDAI, ZUSDC], txConfig);
  await deployerApp.deploy(
    Settings,
    requiredSubmissions,
    maximumTolerance,
    responseExpiry,
    safetyInterval,
    termsExpiryTime,
    liquidateEthPrice,
    txConfig
  );
  const aggregators = {};
  
  for (const chainlinkOraclePair of chainlinkOraclesRequired) {
    const chainlinkOracleAddress = chainlink[chainlinkOraclePair];
  
    await deployerApp.deployWith(
      `ChainlinkPairAggregator_${chainlinkOraclePair.toUpperCase()}`,
      ChainlinkPairAggregator,
      chainlinkOracleAddress,
      txConfig
    );
    console.log(`New aggregator for ${chainlinkOraclePair}: ${ChainlinkPairAggregator.address} (using Chainlink Oracle address ${chainlinkOracleAddress})`);
    aggregators[chainlinkOraclePair] = ChainlinkPairAggregator.address;
  }

  const deployConfig = {
    tokens,
    aggregators,
  };

  const artifacts = {
    Lenders,
    LendingPool,
    InterestConsensus,
    LoanTermsConsensus,
    Settings,
  };
  const poolDeployer = new PoolDeployer(deployerApp, deployConfig, artifacts);

  await poolDeployer.deployPool(
    { tokenName: 'DAI', collateralName: 'ETH' },
    EtherLoans,
    ZDAI,
    txConfig
  );
  await poolDeployer.deployPool(
    { tokenName: 'USDC', collateralName: 'ETH' },
    EtherLoans,
    ZUSDC,
    txConfig
  );

  await poolDeployer.deployPool(
    { tokenName: 'DAI', collateralName: 'LINK', oracleTokenName: 'USD' },
    TokenLoans,
    ZDAI,
    txConfig
  );
  await poolDeployer.deployPool(
    { tokenName: 'USDC', collateralName: 'LINK', oracleTokenName: 'USD' },
    TokenLoans,
    ZUSDC,
    txConfig
  );

  deployerApp.print();
  deployerApp.writeJson();
  console.log(`${'='.repeat(25)} Deployment process finished. ${'='.repeat(25)}`);
};