/** Platform configuration keys for smart contracts. */

/** Platform configuration values. */

// Mock Smart Contracts
const ZeroCollateralMock = artifacts.require("./mock/Mock.sol");

// Libraries

// Official Smart Contracts

module.exports = function(deployer, network, accounts) {
  console.log(`Deploying smart contracts to '${network}'.`)

  deployer.deploy(ZeroCollateralMock).then(async () => {
    console.log(`>>>>>>>>>> Deployment Finished <<<<<<<<<<`)
  });
};