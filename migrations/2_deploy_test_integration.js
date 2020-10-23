const assert = require("assert");

const DeployerApp = require("./utils/DeployerApp");

const InitializeableDynamicProxy = artifacts.require("./base/InitializeableDynamicProxy.sol");

// Mock Smart Contracts
const PairAggregatorMock = artifacts.require("./mock/providers/chainlink/PairAggregatorMock.sol");

module.exports = async function(deployer, network, accounts) {
  // We only deploy the Chainlink mocks on the ganache-mainnet netwotk.
  if (![ "ganache-mainnet", "ropsten" ].includes(network)) return;

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

  const initialUsdcEthPrice = "2797359000000000";
  const initialDaiEthPrice = "2827359000000000";
  const initialLinkEthPrice = "29282830000000000";

  const initialUsdLinkPrice = "100704900000000000"; // 1 LINK = 9.93 USD or 1 USD = 0.1007049

  await deployerApp.deployChainlinkAggregator(PairAggregatorMock, "USDC", "ETH", initialUsdcEthPrice, 18, txConfig);
  await deployerApp.deployChainlinkAggregator(PairAggregatorMock, "DAI", "ETH", initialDaiEthPrice, 18, txConfig);
  await deployerApp.deployChainlinkAggregator(PairAggregatorMock, "LINK", "ETH", initialLinkEthPrice, 18, txConfig);
  await deployerApp.deployChainlinkAggregator(PairAggregatorMock, "USDC", "LINK", initialUsdLinkPrice, 18, txConfig);
  await deployerApp.deployChainlinkAggregator(PairAggregatorMock, "DAI", "LINK", initialUsdLinkPrice, 18, txConfig);

  deployerApp.writeChainlink();
  console.log(`${"=".repeat(25)} Deployment process finished. ${"=".repeat(25)}`);
};