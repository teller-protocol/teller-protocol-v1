const MOCK_NETWORKS = ['test', 'soliditycoverage'];
const initAssetSettings = require('./initAssetSettings')
const initNodeComponentsSettings = require('./initComponentsVersions')

module.exports = async function (
    settingsInstance, web3, {
        nodeComponentsVersions,
        assetSettings,
        tokens,
        compound,
        txConfig,
        network,
    }, {
        ERC20
    },
) {
    console.log('Initializing platform settings.');
    // Initializing node components
    await initNodeComponentsSettings(settingsInstance, nodeComponentsVersions, web3);

    const isMockNetwork = MOCK_NETWORKS.indexOf(network) > -1;
    if (isMockNetwork) {
        /*
            As we validate (in contracts):
                - Some address (ex: cToken address) must be a contract address.

            We don't initialize the settings in the mock networks (test, and soliditycoverage) because they are dummy addresses (not contracts).
        */
        console.log('Mock network detected. Platform settings is not configured.');
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