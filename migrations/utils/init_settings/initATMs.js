const _ = require('lodash');
const assert = require('assert');
const { atmGovernance } = require('../../../test/utils/events');


module.exports = async function(
    { atmFactory },
    { atms, txConfig, },
    { ATMGovernance },
) {
    const atmKeys = Object.keys(atms);
    console.log(`Creating ${atmKeys.length} ATMs.`);
    for (const atmKey of atmKeys) {
        const atmInfo = atms[atmKey];
        assert(!_.isUndefined(atmInfo), `ATM info is undefined for key ${atmKey}.`);
        const {
            name,
            token,
            supplyToDebt,
        } = atmInfo;

        await atmFactory.createATM(
            token.name,
            token.symbol,
            token.decimals,
            token.maxCap,
            token.maxVestingsPerWallet,
            txConfig,
        );

        const atmsList = await atmFactory.getATMs();
        const lastATM = atmsList[atmsList.length - 1];
        console.log(`Last ATM: ${lastATM}`);
        
    }
}