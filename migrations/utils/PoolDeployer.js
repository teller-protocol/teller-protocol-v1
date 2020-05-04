const assert = require('assert');

class PoolDeployer {
    constructor(deployer, deployConfig, artifacts) {
        this.deployer = deployer;
        this.deployConfig = deployConfig;
        this.artifacts = artifacts;
    }
}

PoolDeployer.prototype.deployPool = async function(aggregatorName, tokenName, ZToken, txConfig) {
    const zTokenInstance = await ZToken.deployed();
    const zTokenName = await zTokenInstance.symbol();
    console.log(`Deploying pool for token ${tokenName}...`);
    const {
        requiredSubmissions,
        maximumTolerance,
        responseExpiry,
        tokens,
        aggregators
    } = this.deployConfig;
    assert(tokenName, 'Token name is undefined.');
    const tokenAddress = tokens[tokenName.toUpperCase()];
    assert(tokenAddress, `Tokens address for token ${tokenName.toUpperCase()} is undefined.`);
  
    assert(aggregatorName, 'Aggregator name is undefined.');
    const aggregatorAddress = aggregators[aggregatorName.toUpperCase()];
    assert(aggregatorAddress, `Aggregator address for aggregator ${aggregatorAddress} is undefined.`);
   
    const {
        Lenders,
        Loans,
        LendingPool,
        InterestConsensus,
        ChainlinkPairAggregator
    } = this.artifacts;

    await this.deployer.deployWith(`ChainlinkPairAggregator_${aggregatorName.toUpperCase()}`, ChainlinkPairAggregator, aggregatorAddress, txConfig);
    await this.deployer.deployWith(`LendingPool_${zTokenName}`, LendingPool, txConfig);
    await this.deployer.deployWith(`InterestConsensus_${zTokenName}`, InterestConsensus, txConfig);
    await this.deployer.deployWith(`Lenders_${zTokenName}`, Lenders, ZToken.address, LendingPool.address, InterestConsensus.address, txConfig);
    await this.deployer.deployWith(`Loans_${zTokenName}`, Loans, ChainlinkPairAggregator.address, LendingPool.address, txConfig);
  
    const lendingPoolInstance = await LendingPool.deployed();
    await lendingPoolInstance.initialize(
      ZToken.address,
      tokenAddress,
      Lenders.address,
      Loans.address
    );
  
    await zTokenInstance.addMinter(LendingPool.address, txConfig);
  
    const consensusInstance = await InterestConsensus.deployed();
    await consensusInstance.initialize(
      Lenders.address,
      requiredSubmissions,
      maximumTolerance,
      responseExpiry
    );
}

module.exports = PoolDeployer;