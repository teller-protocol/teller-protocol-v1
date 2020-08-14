const assert = require('assert');
const { NULL_ADDRESS } = require('../../test/utils/consts');

class PoolDeployer {
    constructor(deployer, deployConfig, artifacts) {
        this.deployer = deployer;
        this.deployConfig = deployConfig;
        this.artifacts = artifacts;
    }
}

PoolDeployer.prototype.deployPool = async function(
    { tokenName, collateralName, aggregatorName = `${tokenName.toUpperCase()}_${collateralName.toUpperCase()}`},
    { Loans, TToken, MarketsState, InterestValidator, ATMSettings },
    txConfig
) {
    assert(aggregatorName, 'Aggregator name is undefined.');
    assert(tokenName, 'Token name is undefined.');
    assert(collateralName, 'Collateral token name is undefined.');
    const zTokenInstance = await TToken.deployed();
    const zTokenName = await zTokenInstance.symbol();
    console.log(`Deploying pool (collateral ${collateralName}) for token ${tokenName}...`);
    console.log(`Using MarketsState address ${MarketsState.address}.`);
    console.log(`Using ATMSettings address ${ATMSettings.address}.`);
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
        LendingPool,
        InterestConsensus,
        Lenders,
        LoanTermsConsensus,
        Settings,
    } = this.artifacts;

    const marketsStateInstance = await MarketsState.deployed();
    const settingsInstance = await Settings.deployed();

    // Upgradable proxy contract, proxy admin address
    const upgradableArgs = [ txConfig.from, '0x' ]
    let contractName

    contractName = `${collateralName.toUpperCase()}_LendingPool_${zTokenName}`
    const lendingPoolInstance = await this.deployer.deployWithUpgradeable(contractName, LendingPool, ...upgradableArgs, txConfig);
    lendingPoolInstance.contractName = contractName

    contractName = `${collateralName.toUpperCase()}_InterestConsensus_${zTokenName}`
    const interestConsensusInstance = await this.deployer.deployWithUpgradeable(contractName, InterestConsensus, ...upgradableArgs, txConfig);
    interestConsensusInstance.contractName = contractName

    contractName = `${collateralName.toUpperCase()}_Lenders_${zTokenName}`
    const lendersInstance = await this.deployer.deployWithUpgradeable(contractName, Lenders, ...upgradableArgs, txConfig);
    lendersInstance.contractName = contractName

    contractName = `${collateralName.toUpperCase()}_LoanTermsConsensus_${zTokenName}`
    const loanTermsConsensusInstance = await this.deployer.deployWithUpgradeable(contractName, LoanTermsConsensus, ...upgradableArgs, txConfig);
    loanTermsConsensusInstance.contractName = contractName

    contractName = `${collateralName.toUpperCase()}_Loans_${zTokenName}`
    const loansInstance = await this.deployer.deployWithUpgradeable(contractName, Loans, ...upgradableArgs, txConfig);
    loansInstance.contractName = contractName

    const interestValidatorAddress = InterestValidator === undefined ? NULL_ADDRESS : InterestValidator.address;
    console.log(`Lending pool is using interest validator ${interestValidatorAddress}.`)

    await lendingPoolInstance.initialize(
        TToken.address,
        tokenAddress,
        lendersInstance.address,
        loansInstance.address,
        cTokenAddress,
        settingsInstance.address,
        marketsStateInstance.address,
        interestValidatorAddress,
    );

    await interestConsensusInstance.initialize(
        lendersInstance.address,
        settingsInstance.address,
        marketsStateInstance.address,
    );

    await lendersInstance.initialize(
        TToken.address,
        lendingPoolInstance.address,
        interestConsensusInstance.address,
        settingsInstance.address,
        marketsStateInstance.address,
    );

    await loanTermsConsensusInstance.initialize(
        loansInstance.address,
        settingsInstance.address,
        marketsStateInstance.address,
    );

    if (collateralName === 'ETH') {
        await loansInstance.initialize(
            aggregatorAddress,
            lendingPoolInstance.address,
            loanTermsConsensusInstance.address,
            settingsInstance.address,
            marketsStateInstance.address,
        );
    } else {
        const collateralAddress = tokens[collateralName.toUpperCase()];
        assert(collateralAddress, `Address for collateral token ${collateralName.toUpperCase()} is undefined.`);
        await loansInstance.initialize(
            aggregatorAddress,
            lendingPoolInstance.address,
            loanTermsConsensusInstance.address,
            settingsInstance.address,
            collateralAddress,
            marketsStateInstance.address,
        );
    }

    await zTokenInstance.addMinter(lendingPoolInstance.address, txConfig);

    const dependsOnMarketsState = [
        lendingPoolInstance, loansInstance,
    ];
    for (const contract of dependsOnMarketsState) {
        console.log(`Adding ${contract.contractName} / ${contract.address} in markets state (${marketsStateInstance.address})`);
        await marketsStateInstance.addWhitelisted(contract.address, txConfig);
    }

    const initializables = [
        lendersInstance, lendingPoolInstance, interestConsensusInstance, loansInstance, loanTermsConsensusInstance
    ];

    for (const initializable of initializables) {
        const result = await initializable.initialized(txConfig);
        assert(result, `${initializable.contractName} is NOT initialized.`);
    }

    console.log('');
    console.log('--- Pool deployment ends ---');
    console.log('');
}

module.exports = PoolDeployer;