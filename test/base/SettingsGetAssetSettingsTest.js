// JS Libraries
const withData = require('leche').withData;
const {
    t,
    NULL_ADDRESS,
} = require('../utils/consts');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsGetAssetSettingsTest', function (accounts) {
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
        _1_with_lending_ctoken: [1, 4, 1, 2400, 1, 2400],
        _2_with_lending_without_ctoken: [2, -1, 1000, 240, 1000, 240],
        _3_not_set: [-1, -1, 0, 0, 0, 0],
    }, function(lendingTokenIndex, cTokenIndex, currentMaxAmount, currentRateProcessFrequency, expectedMaxAmountResult, expectedRateProcessFrequencyResult) {
        it(t('user', 'getAssetSettings', 'Should be able to get the current max lending amount.', false), async function() {
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
            const {
                maxLendingAmount: maxLendingAmountResult,
                rateProcessFrequency: rateProcessFrequencyResult,
                cTokenAddress: cTokenAddressResult,
            } = await instance.getAssetSettings(lendingTokenAddress);
            
            // Assertions
            assert.equal(maxLendingAmountResult.toString(), expectedMaxAmountResult.toString());
            assert.equal(rateProcessFrequencyResult.toString(), expectedRateProcessFrequencyResult.toString());
            assert.equal(cTokenAddressResult.toString(), cTokenAddress.toString());
        });
    });
});