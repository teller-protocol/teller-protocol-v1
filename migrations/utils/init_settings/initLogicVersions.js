const assert = require('assert');
const {
    toDecimals, toBytes32
} = require('../../../test/utils/consts');

/**
 * We set all assets settings.
 * 
 * @param settingsInstance a Settings contract instance.
 * @param param1 contains the settings we need for the asset.
 * @param param2 contains an ERC20Detailed instance. 
 */
module.exports = async function (
    logicContracts,
    instances,
    params,
) {
    console.log('\n');
    console.log('Initializing logic versions.');
    const { logicVersionsRegistryInstance } = instances;
    const { txConfig } = params;
    for (const [, value] of logicContracts.entries()) {
        const { name, nameBytes32, address } = value;
        console.log(`Registering logic: Name / Key: ${name} / ${nameBytes32} - Address: ${address} - Version: 1.`);
        await logicVersionsRegistryInstance.createLogicVersion(
            nameBytes32,
            address,
            txConfig,
        );
    }
    console.log('\n');
}