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
        settings = await Settings.new(1, 1);
        instance = await BaseMock.new(settings.address);
    });

    withData({
        _1_notPaused: [false, 'PLATFORM_OR_POOL_IS_NOT_PAUSED', true],
        _2_paused: [true, undefined, false],
    }, function(callpause, expectedErrorMessage, mustFail) {
        it(t('user', 'externalWhenPaused / Platform', 'Should (or not) be able to call function when it is/isnt paused.', mustFail), async function() {
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
        _1_notPaused: [1, 2, false, 'PLATFORM_OR_POOL_IS_NOT_PAUSED', true],
        _2_paused: [2, 2, true, undefined, false]
    }, function(lendingPoolIndex, senderIndex, callPause, expectedErrorMessage,mustFail) {
        it(t('user', 'externalWhenNotPaused / Lending', 'Should (or not) be able to call function when a lending address is/isnt paused.', mustFail), async function() {
            // Setup
            const senderAddress = accounts[senderIndex];
            const lendingPoolAddress = accounts[lendingPoolIndex];
            if (callPause) {
                await settings.pauseLendingPool(lendingPoolAddress, { from: owner });
            }

            try {
                // Invocation
                const result = await instance.externalWhenPausedAn(lendingPoolAddress, { from: senderAddress });
                
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