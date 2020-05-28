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
        LoanTermsConsensus,
        ChainlinkPairAggregator,
        Settings,
    } = this.artifacts;

    await this.deployer.deployWith(`ChainlinkPairAggregator_${aggregatorName.toUpperCase()}`, ChainlinkPairAggregator, aggregatorAddress, txConfig);
    await this.deployer.deployWith(`LendingPool_${zTokenName}`, LendingPool, txConfig);
    await this.deployer.deployWith(`InterestConsensus_${zTokenName}`, InterestConsensus, txConfig);
    await this.deployer.deployWith(`Lenders_${zTokenName}`, Lenders, txConfig);
    await this.deployer.deployWith(`LoanTermsConsensus_${zTokenName}`, LoanTermsConsensus, txConfig);
    await this.deployer.deployWith(`Loans_${zTokenName}`, Loans, txConfig);
    
    const lenderInstance = await Lenders.deployed();
    const lendingPoolInstance = await LendingPool.deployed();
    const settingsInstance = await Settings.deployed();
    const interestConsensus = await InterestConsensus.deployed();
    const loansInstance = await Loans.deployed();
    const loanTermConsensus = await LoanTermsConsensus.deployed();

    await loansInstance.initialize(
        ChainlinkPairAggregator.address,
        LendingPool.address,
        LoanTermsConsensus.address,
        Settings.address,
    );
    await lenderInstance.initialize(
        ZToken.address,
        LendingPool.address,
        InterestConsensus.address,
        Settings.address,
    );
    
    await lendingPoolInstance.initialize(
        ZToken.address,
        tokenAddress,
        Lenders.address,
        Loans.address,
        '0x65c2Fe7C4Ef4d6E8f2eB2aC8A116af04566bF490',          // NEEDS TO CHANGE TO CTOKEN
        settingsInstance.address,
    );
  
    await zTokenInstance.addMinter(LendingPool.address, txConfig);
  
    await interestConsensus.initialize(
        Lenders.address,
        settingsInstance.address
    );

    await loanTermConsensus.initialize(
        Loans.address,
        settingsInstance.address
    );

    const initializables = [
        Lenders, LendingPool, InterestConsensus, Loans
    ];

    for (const initializable of initializables) {
        const deployed = await initializable.deployed();
        const result = await deployed.initialized();
        assert(result, `${initializable.contract_name} is NOT initialized.`);
    }
}

module.exports = PoolDeployer;