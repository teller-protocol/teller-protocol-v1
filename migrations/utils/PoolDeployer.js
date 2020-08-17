const assert = require('assert');
const { NULL_ADDRESS } = require('../../test/utils/consts');
const initSignerAddresses = require('../utils/init_settings/initSignerAddresses');

class PoolDeployer {
    constructor(deployer, deployConfig, artifacts) {
        this.deployer = deployer;
        this.deployConfig = deployConfig;
        this.artifacts = artifacts;
    }
}

PoolDeployer.prototype.deployPool = async function(
    { tokenName, collateralName, aggregatorName = `${tokenName.toUpperCase()}_${collateralName.toUpperCase()}`},
    { Loans, TToken },
    instances,
    txConfig
) {
    const {
        marketsStateInstance,
        settingsInstance,
        atmSettingsInstance,
        interestValidatorInstance,
    } = instances;

    assert(aggregatorName, 'Aggregator name is undefined.');
    assert(tokenName, 'Token name is undefined.');
    assert(collateralName, 'Collateral token name is undefined.');
    const tTokenInstance = await TToken.deployed();
    const tTokenName = await tTokenInstance.symbol();
    console.log(`Deploying pool (collateral ${collateralName}) for token ${tokenName}...`);
    console.log(`Using MarketsState address ${marketsStateInstance.address}.`);
    console.log(`Using ATMSettings address ${atmSettingsInstance.address}.`);
    const {
        tokens,
        aggregators,
        signers,
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
    } = this.artifacts;

    // Upgradable proxy contract, proxy admin address
    const upgradableArgs = [ txConfig.from, '0x' ]
    let contractName

    contractName = `${collateralName.toUpperCase()}_LendingPool_${tTokenName}`
    const lendingPoolInstance = await this.deployer.deployWithUpgradeable(contractName, LendingPool, ...upgradableArgs, txConfig);
    lendingPoolInstance.contractName = contractName

    contractName = `${collateralName.toUpperCase()}_InterestConsensus_${tTokenName}`
    const interestConsensusInstance = await this.deployer.deployWithUpgradeable(contractName, InterestConsensus, ...upgradableArgs, txConfig);
    interestConsensusInstance.contractName = contractName

    contractName = `${collateralName.toUpperCase()}_Lenders_${tTokenName}`
    const lendersInstance = await this.deployer.deployWithUpgradeable(contractName, Lenders, ...upgradableArgs, txConfig);
    lendersInstance.contractName = contractName

    contractName = `${collateralName.toUpperCase()}_LoanTermsConsensus_${tTokenName}`
    const loanTermsConsensusInstance = await this.deployer.deployWithUpgradeable(contractName, LoanTermsConsensus, ...upgradableArgs, txConfig);
    loanTermsConsensusInstance.contractName = contractName

    contractName = `${collateralName.toUpperCase()}_Loans_${tTokenName}`
    const loansInstance = await this.deployer.deployWithUpgradeable(contractName, Loans, ...upgradableArgs, txConfig);
    loansInstance.contractName = contractName

    const interestValidatorAddress = interestValidatorInstance === undefined ? NULL_ADDRESS : interestValidatorInstance.address;
    console.log(`Lending pool is using interest validator ${interestValidatorAddress}.`)
    console.log(`Lending pool: initializing...`);
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

    console.log(`InterestConsensus: initializing...`);
    await interestConsensusInstance.initialize(
        lendersInstance.address,
        settingsInstance.address,
        marketsStateInstance.address,
    );

    console.log(`Lenders: initializing...`);
    await lendersInstance.initialize(
        TToken.address,
        lendingPoolInstance.address,
        interestConsensusInstance.address,
        settingsInstance.address,
        marketsStateInstance.address,
    );

    console.log(`LoanTermsConsensus: initializing...`);
    await loanTermsConsensusInstance.initialize(
        loansInstance.address,
        settingsInstance.address,
        marketsStateInstance.address,
    );

    if (collateralName === 'ETH') {
        console.log(`EtherCollateralLoans: initializing...`);
        await loansInstance.initialize(
            aggregatorAddress,
            lendingPoolInstance.address,
            loanTermsConsensusInstance.address,
            settingsInstance.address,
            marketsStateInstance.address,
            atmSettingsInstance.address,
        );
    } else {
        console.log(`TokenCollateralLoans: initializing...`);
        const collateralAddress = tokens[collateralName.toUpperCase()];
        assert(collateralAddress, `Address for collateral token ${collateralName.toUpperCase()} is undefined.`);
        await loansInstance.initialize(
            aggregatorAddress,
            lendingPoolInstance.address,
            loanTermsConsensusInstance.address,
            settingsInstance.address,
            collateralAddress,
            marketsStateInstance.address,
            atmSettingsInstance.address,
        );
    }

    console.log(`tToken: Adding as minter LendingPool (${lendingPoolInstance.address}).`);
    await tTokenInstance.addMinter(lendingPoolInstance.address, txConfig);

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

    await initSignerAddresses(
        { loanTermsConsensusInstance, interestConsensusInstance },
        { signers, txConfig },
        { },
    );

    console.log('');
    console.log('--- Pool deployment ends ---');
    console.log('');
}

module.exports = PoolDeployer;