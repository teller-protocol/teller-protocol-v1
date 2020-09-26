const assert = require("assert");
const DeployerApp = require("./utils/DeployerApp");
const InitializeableDynamicProxy = artifacts.require("./base/InitializeableDynamicProxy.sol");

// Mock Smart Contracts
const PairAggregatorMock = artifacts.require("./mock/providers/chainlink/PairAggregatorMock.sol");

module.exports = async function(deployer, network, accounts) {
  if (network !== 'ganache-mainnet') return

  console.log(`Deploying smart contracts to '${network}'.`);
  // Getting network configuration.
  const appConfig = await require("../config")(network);
  const { networkConfig, env } = appConfig;

  // Getting configuration values.
  const deployerAccountIndex = env.getDefaultAddressIndex().getOrDefault();
  const deployerAccount = accounts[deployerAccountIndex];
  console.log(`Deployer account index is ${deployerAccountIndex} => ${deployerAccount}`);
  const { maxGasLimit } = networkConfig;
  assert(maxGasLimit, `Max gas limit for network ${network} is undefined.`);

  const txConfig = { gas: maxGasLimit, from: deployerAccount };

  // Creating DeployerApp helper.
  const deployerApp = new DeployerApp(deployer, web3, deployerAccount, { InitializeableDynamicProxy }, {
    network,
    networkConfig
  });

  const initialUsdcEthPrice = '4789225000000000';
  const initialDaiEthPrice = '4806625000000000';
  const initialLinkUsdPrice = '2415458937198';
  await deployerApp.deployChainlink(PairAggregatorMock, {
    inversed: false,
    collateralDecimals: 18,
    responseDecimals: 18,
    baseTokenName: "USDC",
    quoteTokenName: "ETH"
  }, initialUsdcEthPrice, txConfig);
  await deployerApp.deployChainlink(PairAggregatorMock, {
    inversed: false,
    collateralDecimals: 18,
    responseDecimals: 18,
    baseTokenName: "DAI",
    quoteTokenName: "ETH"
  }, initialDaiEthPrice, txConfig);
  await deployerApp.deployChainlink(PairAggregatorMock, {
    inversed: false,
    collateralDecimals: 18,
    responseDecimals: 8,
    baseTokenName: "LINK",
    quoteTokenName: "DAI"
  }, initialLinkUsdPrice, txConfig);
  await deployerApp.deployChainlink(PairAggregatorMock, {
    inversed: false,
    collateralDecimals: 18,
    responseDecimals: 8,
    baseTokenName: "LINK",
    quoteTokenName: "USDC"
  }, initialLinkUsdPrice, txConfig);

  deployerApp.writeChainlink();
  console.log(`${"=".repeat(25)} Deployment process finished. ${"=".repeat(25)}`);
};