const {
    toBytes32
} = require('../../../test/utils/consts.js');

const componentNames = require('../../../test/utils/componentNames');

/**
 * We add initial Node Components version to Settings contract to start the platform.
 * 
 * @param settingsInstance a Settings contract instance. 
 * @param web3 web3 library reference.
 */
module.exports = function (settingsInstance, nodeComponentsVersions, web3) {
    console.log('Initializing Node Components versions on settings.');
    console.log(`Node component: ${componentNames.WEB2} version: ${nodeComponentsVersions.WEB2}`);
    settingsInstance.createComponentVersion(toBytes32(web3, componentNames.WEB2), nodeComponentsVersions.WEB2);
    console.log(`Node component: ${componentNames.EVENT_LISTENER} version: ${nodeComponentsVersions.EVENT_LISTENER}`);
    settingsInstance.createComponentVersion(toBytes32(web3, componentNames.EVENT_LISTENER), nodeComponentsVersions.EVENT_LISTENER);
    console.log(`Node component: ${componentNames.POSTGRES} version: ${nodeComponentsVersions.POSTGRES}`);
    settingsInstance.createComponentVersion(toBytes32(web3, componentNames.POSTGRES), nodeComponentsVersions.POSTGRES);
    console.log(`Node component: ${componentNames.REDIS} version: ${nodeComponentsVersions.REDIS}`);
    settingsInstance.createComponentVersion(toBytes32(web3, componentNames.REDIS), nodeComponentsVersions.REDIS);
}