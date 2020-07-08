// JS Libraries
const withData = require('leche').withData;
const {
    t,
    NULL_ADDRESS,
} = require('../utils/consts');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsHasAssetSettingsTest', function (accounts) {
    const INITIAL_VALUE = 1;
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await Settings.new(
            INITIAL_VALUE, // Sets RequiredSubmissions
            INITIAL_VALUE, // Sets MaximumTolerance
            INITIAL_VALUE, // Sets ResponseExpiryLength
            INITIAL_VALUE, // Sets SafetyInterval
            INITIAL_VALUE, // Sets TermsExpiryTime
            INITIAL_VALUE // Sets LiquidateEthPrice
        );
    });

    withData({
        _1_with_lending_ctoken: [1, 4, 1, 2400, true],
        _2_with_lending_without_ctoken: [2, -1, 1000, 240, true],
        _3_not_set: [-1, -1, 0, 0, false],
    }, function(lendingTokenIndex, cTokenIndex, currentMaxAmount, currentRateProcessFrequency, expectedResult) {
        it(t('user', 'hasAssetSettings', 'Should be able to test if it has the asset settings.', false), async function() {
            // Setup
            const cTokenAddress = cTokenIndex === -1 ? NULL_ADDRESS : accounts[cTokenIndex];
            const lendingTokenAddress = lendingTokenIndex === -1 ? NULL_ADDRESS : accounts[lendingTokenIndex];
            const sender = accounts[0];
            if (currentMaxAmount > 0 && currentRateProcessFrequency > 0) {
                await instance.createAssetSettings(
                    lendingTokenAddress,
                    cTokenAddress,
                    currentMaxAmount,
                    currentRateProcessFrequency,
                    { from: sender }
                );
            }

            // Invocation
            const result = await instance.hasAssetSettings(lendingTokenAddress);
            
            // Assertions
            assert.equal(result.toString(), expectedResult.toString());
        });
    });
});