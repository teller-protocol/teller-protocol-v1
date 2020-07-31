const assert = require('assert');
const { toDecimals } = require('../../test/utils/consts');
const MOCK_NETWORKS = ['test', 'soliditycoverage'];

module.exports = async function(
    settingsInstance,
    { assetSettings, tokens, compound, txConfig, network, },
) {
    const isMockNetwork = MOCK_NETWORKS.indexOf(network) > -1;
    if(isMockNetwork) {
        /*
            As we validate (in contracts):
                - Some address (ex: cToken address) must be a contract address.
            We don't initialize the settings in the mock networks (test, and soliditycoverage) because they are dummy addresses (not contracts).
        */
        console.log('Mock network detected. Platform settings is not configured.');
        return;
    }
    console.log('Initializing platform settings.');
    console.log('Configuring Node Components settings.')
    for (const tokenName of Object.keys(assetSettings)) {
        const tokenConfig = assetSettings[tokenName];

        const tokenAddress = tokens[tokenName.toUpperCase()];
        assert(tokenAddress, `Token address (${tokenName}) not found (${network}).`);
        const cTokenAddress = compound[tokenConfig.cToken.toUpperCase()];
        assert(cTokenAddress, `cToken address (${tokenConfig.cToken}) not found (${network}).`);

        const tokenInstance = await ERC20.at(tokenAddress);
        const decimals = await tokenInstance.decimals();
        const maxLoanAmountWithDecimals = toDecimals(tokenConfig.maxLoanAmount, decimals);

        console.log(`Configuring asset: ${tokenName} (${tokenAddress}) / ${tokenConfig.cToken} (${cTokenAddress}) / Max Loan Amount: ${tokenConfig.maxLoanAmount} (${maxLoanAmountWithDecimals.toFixed(0)})`);
        await settingsInstance.createAssetSettings(
            tokenAddress,
            cTokenAddress,
            maxLoanAmountWithDecimals,
            txConfig,
        );
    }
} 