const assert = require('assert');

class PoolDeployer {
    constructor(deployer, deployConfig, artifacts) {
        this.deployer = deployer;
        this.deployConfig = deployConfig;
        this.artifacts = artifacts;
    }
}

PoolDeployer.prototype.deployPool = async function(
    { tokenName, collateralName, aggregatorName = `${tokenName.toUpperCase()}_${collateralName.toUpperCase()}`},
    { Loans, TToken, MarketsState },
    txConfig
) {
    assert(aggregatorName, 'Aggregator name is undefined.');
    assert(tokenName, 'Token name is undefined.');
    assert(collateralName, 'Collateral token name is undefined.');
    const zTokenInstance = await TToken.deployed();
    const zTokenName = await zTokenInstance.symbol();
    console.log(`Deploying pool (collateral ${collateralName}) for token ${tokenName}...`);
    console.log(`Using MarketsState address ${MarketsState.address}.`);
    const {
        tokens,
        aggregators,
        cTokens
    } = this.deployConfig;
    const tokenAddress = tokens[tokenName.toUpperCase()];
    assert(tokenAddress, `Tokens address for token ${tokenName.toUpperCase()} is undefined.`);

    console.log(`Aggregator name: ${aggregatorName.toUpperCase()}`);
    const aggregatorAddress = aggregators[aggregatorName.toUpperCase()];
    assert(aggregatorAddress, `Aggregator address for aggregator ${aggregatorName} is undefined.`);

    const cTokenName = 'C'.concat(tokenName)
    const cTokenAddress = cTokens[cTokenName.toUpperCase()]
    assert(cTokenAddress, `CToken address for ${cTokenName} is undefined.`);

    assert(aggregatorAddress, `Aggregator address for aggregator ${aggregatorAddress} is undefined.`);
    console.log(`Using oracle aggregator '${aggregatorAddress}' for pair '${aggregatorName}'.`);
    const {
        Lenders,
        LendingPool,
        InterestConsensus,
        LoanTermsConsensus,
        Settings,
    } = this.artifacts;

    await this.deployer.deployWith(`${collateralName.toUpperCase()}_LendingPool_${zTokenName}`, LendingPool, txConfig);
    await this.deployer.deployWith(`${collateralName.toUpperCase()}_InterestConsensus_${zTokenName}`, InterestConsensus, txConfig);
    await this.deployer.deployWith(`${collateralName.toUpperCase()}_Lenders_${zTokenName}`, Lenders, txConfig);
    await this.deployer.deployWith(`${collateralName.toUpperCase()}_LoanTermsConsensus_${zTokenName}`, LoanTermsConsensus, txConfig);
    await this.deployer.deployWith(`${collateralName.toUpperCase()}_Loans_${zTokenName}`, Loans, txConfig);
    
    const marketsStateInstance = await MarketsState.deployed();
    const lenderInstance = await Lenders.deployed();
    const lendingPoolInstance = await LendingPool.deployed();
    const settingsInstance = await Settings.deployed();
    const interestConsensus = await InterestConsensus.deployed();
    const loansInstance = await Loans.deployed();
    const loanTermConsensus = await LoanTermsConsensus.deployed();

    if( collateralName === 'ETH' ) {
        await loansInstance.initialize(
            aggregatorAddress,
            LendingPool.address,
            LoanTermsConsensus.address,
            Settings.address,
            MarketsState.address,
        );
    } else {
        const collateralAddress = tokens[collateralName.toUpperCase()];
        assert(collateralAddress, `Address for collateral token ${collateralName.toUpperCase()} is undefined.`);
        await loansInstance.initialize(
            aggregatorAddress,
            LendingPool.address,
            LoanTermsConsensus.address,
            Settings.address,
            collateralAddress,
            MarketsState.address,
        );
    }
    await lenderInstance.initialize(
        TToken.address,
        LendingPool.address,
        InterestConsensus.address,
        Settings.address,
        MarketsState.address,
    );
    
    await lendingPoolInstance.initialize(
        TToken.address,
        tokenAddress,
        Lenders.address,
        Loans.address,
        cTokenAddress,
        settingsInstance.address,
        MarketsState.address,
    );
  
    await zTokenInstance.addMinter(LendingPool.address, txConfig);
  
    await interestConsensus.initialize(
        Lenders.address,
        settingsInstance.address,
        MarketsState.address,
    );

    await loanTermConsensus.initialize(
        Loans.address,
        settingsInstance.address,
        MarketsState.address,
    );

    const dependsOnMarketsState = [
        LendingPool, Loans,
    ];
    for (const contract of dependsOnMarketsState) {
        const deployed = await contract.deployed();
        console.log(`Adding ${contract.contract_name} / ${deployed.address} in markets state (${MarketsState.address})`);
        marketsStateInstance.addWhitelisted(contract.address, txConfig);
    }

    const initializables = [
        Lenders, LendingPool, InterestConsensus, Loans, LoanTermsConsensus
    ];

    for (const initializable of initializables) {
        const deployed = await initializable.deployed();
        const result = await deployed.initialized();
        assert(result, `${initializable.contract_name} is NOT initialized.`);
    }
}

module.exports = PoolDeployer;