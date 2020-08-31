const _ = require('lodash');
const assert = require('assert');
const { toBytes32 } = require('../../../test/utils/consts');
const atmGovernanceSettingsNames = require('../../../test/utils/atmGovernanceSettingsNames');


module.exports = async function(
    { atmFactory, atmSettings, },
    { atms, tokens, txConfig, web3 },
    { ATMGovernance },
) {
    console.log('\n');
    const atmKeys = Object.keys(atms);
    console.log(`Creating ${atmKeys.length} ATMs.`);
    return;//TODO Fix CONTRACT_ALREADY_INITIALIZED ATMFactory.createATM >>> atmGovernanceProxy.initialize(address(settings), owner);
    for (const atmKey of atmKeys) {
        const atmInfo = atms[atmKey];
        assert(!_.isUndefined(atmInfo), `ATM info is undefined for key ${atmKey}.`);
        const {
            name,
            token,
            supplyToDebt,
            markets,
        } = atmInfo;
        console.log(`Creating ATM ${atmKey}: ${token.name}/${token.symbol}/${token.decimals} - Max. Cap.: ${token.maxCap} - Max. Vestings per Wallet: ${token.maxVestingsPerWallet}`);

        await atmFactory.createATM(
            token.name,
            token.symbol,
            token.decimals,
            token.maxCap,
            token.maxVestingsPerWallet,
            txConfig,
        );

        const atmsList = await atmFactory.getATMs();
        const lastATMGovernanceProxyAddress = atmsList[atmsList.length - 1];
        console.log(`New ATM created (for key: ${name}) at address ${lastATMGovernanceProxyAddress}.`);

        const atmGovernanceProxyInstance = await ATMGovernance.at(lastATMGovernanceProxyAddress);
        
        console.log(`Configuring ATM ${lastATMGovernanceProxyAddress}: SupplyToDebt = ${supplyToDebt}`);
        await atmGovernanceProxyInstance.addGeneralSetting(
            toBytes32(web3, atmGovernanceSettingsNames.SupplyToDebt),
            supplyToDebt,
            txConfig,
        );

        for (const market of markets) {
            const {
                borrowedToken, collateralToken,
            } = market;
            const borrowedTokenAddress = tokens[borrowedToken.toUpperCase()];
            const collateralTokenAddress = tokens[collateralToken.toUpperCase()];
            assert(borrowedTokenAddress, `Token ${borrowedToken} is undefined.`);
            assert(collateralTokenAddress, `Token ${collateralToken} is undefined.`);
            console.log(`Configuring market ${borrowedToken}/${collateralToken} for ATM ${name} / ${lastATMGovernanceProxyAddress}.`);
            await atmSettings.setATMToMarket(
                borrowedTokenAddress,
                collateralTokenAddress,
                lastATMGovernanceProxyAddress,
                txConfig,
            );
        }
    }
    console.log('\n');
}