// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const { settings } = require('../utils/events');

// Mock contracts

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('SettingsPauseLendingPoolTest', function (accounts) {
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await Settings.new(1, 1, 1, 1);
    });

    withData({
        _1_basic: [0, 1, undefined, false],
        _2_notOwner: [2, 3, 'PauserRole: caller does not have the Pauser role', true],
        _3_emptyLendingPool: [0, -1, 'LENDING_POOL_IS_REQUIRED', true],
    }, function(senderIndex, lendingPoolIndex, expectedErrorMessage, mustFail) {
        it(t('user', 'pauseLendingPool', 'Should (or not) be able to pause a lending pool.', mustFail), async function() {
            // Setup
            const lendingPool = lendingPoolIndex === -1 ? NULL_ADDRESS : accounts[lendingPoolIndex];
            const sender = accounts[senderIndex];

            try {
                // Invocation
                const result = await instance.pauseLendingPool(lendingPool, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                const isLendingPoolPaused = await instance.lendingPoolPaused(lendingPool);
                assert(isLendingPoolPaused, 'Lending pool should be paused.');

                settings
                    .lendingPoolPaused(result)
                    .emitted(sender, lendingPool);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_basic: [0, 1],
    }, function(senderIndex, lendingPoolIndex) {
        it(t('user', 'pauseLendingPool', 'Should NOT be able to pause a lending pool twice.', true), async function() {
            // Setup
            const lendingPool = accounts[lendingPoolIndex];
            const sender = accounts[senderIndex];
            await instance.pauseLendingPool(lendingPool, { from: sender });

            try {
                // Invocation
                await instance.pauseLendingPool(lendingPool, { from: sender });
                
                // Assertions
                fail('It should have failed because data is invalid.');
            } catch (error) {
                // Assertions
                assert(error);
                assert.equal(error.reason, 'LENDING_POOL_ALREADY_PAUSED');
            }
        });
    });
});