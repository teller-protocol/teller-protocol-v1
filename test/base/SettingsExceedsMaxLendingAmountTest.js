// JS Libraries
const withData = require('leche').withData;
const {
    t,
    NULL_ADDRESS
} = require('../utils/consts');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsExceedsMaxLendingAmountTest', function (accounts) {
    const INITIAL_VALUE = 1;
    const INITIAL_RATE_PROCESS_FREQUENCY = 240;
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
        _1_with_cToken_not_exceeds_max: [3, 1, 1000, 100, false],
        _2_with_cToken_exceeds_max: [5, 2, 1000, 1200, true],
        _3_with_cToken_same_value: [7, 3, 1000, 1000, false],
        _4_with_cToken_not_set: [8, 4, 0, 1000, true],
        _5_without_cToken_not_exceeds_max: [-1, 1, 1000, 100, false],
        _6_without_cToken_exceeds_max: [-1, 2, 1000, 1200, true],
        _7_without_cToken_same_value: [-1, 3, 1000, 1000, false],
        _8_without_cToken_not_set: [-1, 4, 0, 1000, true],
    }, function(cTokenIndex, lendingTokenIndex, currentValue, amountToTest, expectedResult) {
        it(t('user', 'exceedsMaxLendingAmount', 'Should be able to test whether amount exceeds max lending amount.', false), async function() {
            // Setup
            const lendingTokenAddress = lendingTokenIndex === -1 ? NULL_ADDRESS : accounts[lendingTokenIndex];
            const cTokenAddress = cTokenIndex === -1 ? NULL_ADDRESS : accounts[cTokenIndex];
            const sender = accounts[0];
            if (currentValue !== 0) {
                await instance.createAssetSettings(
                    lendingTokenAddress,
                    cTokenAddress,
                    currentValue,
                    INITIAL_RATE_PROCESS_FREQUENCY,
                    { from: sender }
                );
            }

            // Invocation
            const result = await instance.exceedsMaxLendingAmount(lendingTokenAddress, amountToTest);
            
            // Assertions
            assert.equal(result.toString(), expectedResult.toString());
        });
    });
});