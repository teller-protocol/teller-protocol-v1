const assert = require('assert');
const DeployerApp = require('./utils/DeployerApp');

// Mock Smart Contracts

// Official Smart Contracts
const ZDai = artifacts.require("./base/ZDai.sol");
const Lenders = artifacts.require("./base/Lenders.sol");
const Loans = artifacts.require("./base/Loans.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");
const InterestConsensus = artifacts.require("./base/InterestConsensus.sol");
const LoanTermsConsensus = artifacts.require("./base/LoanTermsConsensus.sol");
const EtherUsdAggregator = artifacts.require("./providers/chainlink/EtherUsdAggregator.sol");

module.exports = async function(deployer, network, accounts) {
  console.log(`Deploying smart contracts to '${network}'.`)
  // Getting network configuration.
  const appConfig = require('../config')(network);
  const { networkConfig, env } = appConfig;

  // Getting configuration values.
  const requiredSubmissions = env.getDefaultRequiredSubmissions().getOrDefault();
  const maximumTolerance = env.getDefaultMaximumTolerance().getOrDefault();
  const deployerAccountIndex = env.getDefaultAddressIndex().getOrDefault();
  const timeWindowToTakeOutLoan = env.getTimeWindowToTakeOutLoan().getOrDefault();
  const deployerAccount = accounts[deployerAccountIndex];
  console.log(`Deployer account index is ${deployerAccountIndex} => ${deployerAccount}`);
  const { maxGasLimit, tokens } = networkConfig;
  assert(maxGasLimit, `Max gas limit for network ${network} is undefined.`);
  const deployOptions = { gas: maxGasLimit, from: deployerAccount };

  // Creating DeployerApp helper.
  const deployerApp = new DeployerApp(deployer, web3, deployerAccount, network);

  await deployerApp.deploy(ZDai, deployOptions);

  const { chainlink: { dataContracts: { eth_usd } } } = networkConfig;
  assert(eth_usd, 'Chainlink ETH/USD data contract is undefined.');
  await deployerApp.deploy(EtherUsdAggregator, eth_usd, deployOptions);

  await deployerApp.deploy(LendingPool, deployOptions);

  await deployerApp.deploy(InterestConsensus, requiredSubmissions, maximumTolerance, deployOptions);
  await deployerApp.deploy(LoanTermsConsensus, requiredSubmissions, maximumTolerance, deployOptions);

  await deployerApp.deploy(
    Lenders,
    ZDai.address,
    LendingPool.address,
    InterestConsensus.address,
    deployOptions,
  );

  await deployerApp.deploy(
    Loans,
    EtherUsdAggregator.address,
    LendingPool.address,
    LoanTermsConsensus.address,
    timeWindowToTakeOutLoan,
    deployOptions,
  );

  const daiLendingPoolInstance = await LendingPool.deployed();
  await daiLendingPoolInstance.initialize(
    ZDai.address,
    tokens.DAI,
    Lenders.address,
    Loans.address
  );

  const zTokenInstance = await ZDai.deployed();
  await zTokenInstance.addMinter(LendingPool.address, { from: deployerAccount });

  const interestConsensusInstance = await InterestConsensus.deployed();
  await interestConsensusInstance.initialize(Lenders.address);

  const loanTermsConsensusInstance = await LoanTermsConsensus.deployed();
  await loanTermsConsensusInstance.initialize(Loans.address);

  deployerApp.print();
  deployerApp.writeJson();
  console.log(`${'='.repeat(25)} Deployment process finished. ${'='.repeat(25)}`);
};