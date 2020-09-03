// JS Libraries
const withData = require('leche').withData;
const { t, createMocks } = require('../utils/consts');
const actions = require('../utils/marketStateActions.js');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const MarketsState = artifacts.require("./base/MarketsState.sol");

contract('MarketsStateIncreaseDecreaseTest', function (accounts) {
    const owner = accounts[0];
    let mocks;
    let instance;
    let settings;
    
    beforeEach('Setup for each test', async () => {
        settings = await Mock.new();
        instance = await MarketsState.new();
        await instance.initialize(settings.address);
        mocks = await createMocks(Mock, 10);
    });

    const newAmount = (amount, type, borrowedIndex, collateralIndex) => ({amount, type, borrowedIndex, collateralIndex});

    withData({
        _1_inc_supply_valid: [[1, 2], 1, newAmount(1000, actions.Inc_Supply, 0, 1), undefined, false],
        _2_inc_supply_not_allowed: [[1, 2], 3, newAmount(2000, actions.Dec_Supply, 1, 2), 'WhitelistedRole: caller does not have the Whitelisted role', true],
        _3_dec_supply_valid: [[2, 3], 2, newAmount(0, actions.Dec_Supply, 0, 1), undefined, false],
        _4_dec_supply_not_allowed: [[4, 5], 3, newAmount(0, actions.Dec_Supply, 1, 2), 'WhitelistedRole: caller does not have the Whitelisted role', true],
        _5_borrow_valid: [[2, 3], 2, newAmount(2000, actions.Borrow, 0, 1), undefined, false],
        _6_borrow_not_allowed: [[4, 5], 3, newAmount(2500, actions.Borrow, 1, 2), 'WhitelistedRole: caller does not have the Whitelisted role', true],
        _7_repay_valid: [[6, 1], 1, newAmount(2000, actions.Repay, 0, 1), undefined, false],
        _8_repay_not_allowed: [[1, 5], 3, newAmount(2500, actions.Repay, 1, 2), 'WhitelistedRole: caller does not have the Whitelisted role', true],
    }, function(owners, senderIndex, {type, borrowedIndex, collateralIndex, amount}, expectedErrorMessage, mustFail) {
        it(t('user', 'increase/decrease', 'Should be able to increase or decrease value.', mustFail), async function() {
            // Setup
            for (const newOwnerIndex of owners) {
                instance.addWhitelisted(accounts[newOwnerIndex], { from: owner});
            }

            const borrowedAssset = mocks[borrowedIndex];
            const collateralAssset = mocks[collateralIndex];
            const sender = accounts[senderIndex];
            try {
                // Invocation
                const result = await actions.execute(
                    instance,
                    type,
                    { borrowedAssset, collateralAssset, amount },
                    { from: sender }
                );

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});