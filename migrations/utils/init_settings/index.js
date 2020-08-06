const MOCK_NETWORKS = ['test', 'soliditycoverage'];
const initAssetSettings = require('./initAssetSettings');
const initPlatformSettings = require('./initPlatformSettings');
const initNodeComponentsSettings = require('./initComponentsVersions');

module.exports = async function (
    settingsInstance, {
        nodeComponentsVersions,
        assetSettings,
        platformSettings,
        tokens,
        compound,
        txConfig,
        network,
        currentBlockNumber,
        web3,
    }, {
        ERC20
    },
) {
    console.log('Initializing settings.');

    await initPlatformSettings(
        settingsInstance,
        { platformSettings, currentBlockNumber, web3, verbose: true },
        { },
    );

    // Initializing node components
    await initNodeComponentsSettings(settingsInstance, nodeComponentsVersions, web3);

    const isMockNetwork = MOCK_NETWORKS.indexOf(network) > -1;
    if (isMockNetwork) {
        /*
            As we validate (in contracts):
                - Some address (ex: cToken address) must be a contract address.

            We don't initialize the asset settings in the mock networks (test, and soliditycoverage) because they are dummy addresses (not contracts).
        */
        console.log('Mock network detected. Asset settings are not configured.');
        return;
    }
    await initAssetSettings(
        settingsInstance, {
            assetSettings,
            tokens,
            compound,
            txConfig,
            network,
        }, {
            ERC20
        }
    );
}