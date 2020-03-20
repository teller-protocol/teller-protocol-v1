const assert = require('assert');

// Mock Smart Contracts
const ZeroCollateralMock = artifacts.require("./mock/Mock.sol");

// Libraries

// Official Smart Contracts
const EtherUsdAggregator = artifacts.require("./providers/chainlink/EtherUsdAggregator.sol");

const printContractDetails = contracts => {
  console.log(`\n${'-'.repeat(25)} Starts contracts info ${'-'.repeat(25)}`);
  contracts.forEach(item => console.log(`${item.contractName}: ${item.address}`));
  console.log(`${'-'.repeat(25)} Ends contracts info ${'-'.repeat(25)}\n`);
};

module.exports = function(deployer, network, accounts) {
  console.log(`Deploying smart contracts to '${network}'.`)
  const appConfig = require('../config')(network);
  const { networkConfig } = appConfig;
  const gasLimit = networkConfig.maxGasLimit;
  
  assert(networkConfig.maxGasLimit, `Max gas limit for network ${network} is undefined.`);
  
  deployer.deploy(ZeroCollateralMock, { gas: gasLimit }).then(async () => {

    const { chainlink: { dataContracts: { eth_usd } } } = networkConfig;
    assert(eth_usd, 'Chainlinnk ETH/USD data contract is undefined.');
    await deployer.deploy(EtherUsdAggregator, eth_usd);

    printContractDetails([
      EtherUsdAggregator,
    ]);
    console.log(`>>>>>>>>>> Deployment Finished <<<<<<<<<<`);
  });
};