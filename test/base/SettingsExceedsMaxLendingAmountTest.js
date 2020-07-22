// JS Libraries
const withData = require('leche').withData;
const {
    t,
} = require('../utils/consts');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsExceedsMaxLendingAmountTest', function (accounts) {
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
        _1_not_exceeds_max: [1, 1000, 100, false],
        _2_exceeds_max: [2, 1000, 1200, true],
        _3_same_value: [3, 1000, 1000, false],
        _4_not_set: [4, 0, 1000, true],
    }, function(lendingTokenIndex, currentValue, amountToTest, expectedResult) {
        it(t('user', 'exceedsMaxLendingAmount', 'Should be able to test whether amount exceeds max lending amount.', false), async function() {
            // Setup
            const lendingTokenAddress = lendingTokenIndex === -1 ? NULL_ADDRESS : accounts[lendingTokenIndex];
            const sender = accounts[0];
            if (currentValue !== 0) {
                await instance.setMaxLendingAmount(lendingTokenAddress, currentValue, { from: sender });
            }

            // Invocation
            const result = await instance.exceedsMaxLendingAmount(lendingTokenAddress, amountToTest);
            
            // Assertions
            assert.equal(result.toString(), expectedResult.toString());
        });
    });
});