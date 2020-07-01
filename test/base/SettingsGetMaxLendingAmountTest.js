// JS Libraries
const withData = require('leche').withData;
const {
    t,
} = require('../utils/consts');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsGetMaxLendingAmountTest', function (accounts) {
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
        _1_basic: [1, 1, 1],
        _2_basic: [2, 1000, 1000],
        _3_not_set: [3, 0, 0],
    }, function(lendingTokenIndex, currentValue, expectedResult) {
        it(t('user', 'getMaxLendingAmount', 'Should be able to get the current max lending amount.', false), async function() {
            // Setup
            const lendingTokenAddress = lendingTokenIndex === -1 ? NULL_ADDRESS : accounts[lendingTokenIndex];
            const sender = accounts[0];
            if (currentValue !== 0) {
                await instance.setMaxLendingAmount(lendingTokenAddress, currentValue, { from: sender });
            }

            // Invocation
            const result = await instance.getMaxLendingAmount(lendingTokenAddress);
            
            // Assertions
            assert.equal(result.toString(), expectedResult.toString());
        });
    });
});