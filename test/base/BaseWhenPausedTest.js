// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Mock contracts
const BaseMock = artifacts.require("./mock/base/BaseMock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('BaseWhenPausedTest', function (accounts) {
    const owner = accounts[0];
    let settings;
    let instance;
    
    beforeEach('Setup for each test', async () => {
        settings = await Settings.new(1, 1, 1);
        instance = await BaseMock.new();
        await instance.externalInitialize(settings.address);
    });

    withData({
        _1_notPaused: [false, 'PLATFORM_IS_NOT_PAUSED', true],
        _2_paused: [true, undefined, false],
    }, function(callpause, expectedErrorMessage, mustFail) {
        it(t('user', 'externalWhenPaused', 'Should (or not) be able to call function when it is/isnt paused.', mustFail), async function() {
            // Setup
            if (callpause) {
                await settings.pause({ from: owner });
            }

            try {
                // Invocation
                const result = await instance.externalWhenPaused();
                
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

    withData({
        _1_notPaused: [2, false, 'LENDING_POOL_IS_NOT_PAUSED', true],
        _2_paused: [2, true, undefined, false]
    }, function(senderIndex, callPause, expectedErrorMessage,mustFail) {
        it(t('user', 'externalWhenNotPaused', 'Should (or not) be able to call function when a lending address is/isnt paused.', mustFail), async function() {
            // Setup
            const senderAddress = accounts[senderIndex];
            if (callPause) {
                await settings.pauseLendingPool(instance.address, { from: owner });
            }

            try {
                // Invocation
                const result = await instance.externalWhenLendingPoolPaused(instance.address, { from: senderAddress });
                
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