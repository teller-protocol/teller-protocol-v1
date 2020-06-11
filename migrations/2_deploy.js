const assert = require('assert');
const DeployerApp = require('./utils/DeployerApp');
const PoolDeployer = require('./utils/PoolDeployer');

// Official Smart Contracts
const ZDAI = artifacts.require("./base/ZDAI.sol");
const ZUSDC = artifacts.require("./base/ZUSDC.sol");
const Settings = artifacts.require("./base/Settings.sol");
const Lenders = artifacts.require("./base/Lenders.sol");
const Loans = artifacts.require("./base/EtherLoans.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");
const InterestConsensus = artifacts.require("./base/InterestConsensus.sol");
const LoanTermsConsensus = artifacts.require("./base/LoanTermsConsensus.sol");
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");

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
  const { maxGasLimit, tokens, chainlink, compound } = networkConfig;
  assert(maxGasLimit, `Max gas limit for network ${network} is undefined.`);
  assert(tokens.DAI, 'DAI token address is not defined.');
  assert(tokens.USDC, 'USDC token address is not defined.');
  assert(chainlink.DAI_ETH, 'Chainlink: DAI/ETH oracle address is undefined.');
  assert(chainlink.USDC_ETH, 'Chainlink: USDC/ETH oracle address is undefined.');

  const txConfig = { gas: maxGasLimit, from: deployerAccount };
  const deployConfig = {
    tokens,
    aggregators: chainlink,
    cTokens: compound,
  };

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
  const artifacts = {
    Lenders,
    Loans,
    LendingPool,
    InterestConsensus,
    LoanTermsConsensus,
    ChainlinkPairAggregator,
    Settings,
  };
  const poolDeployer = new PoolDeployer(deployerApp, deployConfig, artifacts);

  await poolDeployer.deployPool('DAI_ETH', 'DAI', ZDAI, txConfig);
  await poolDeployer.deployPool('USDC_ETH', 'USDC', ZUSDC, txConfig);

  deployerApp.print();
  deployerApp.writeJson();
  console.log(`${'='.repeat(25)} Deployment process finished. ${'='.repeat(25)}`);
};