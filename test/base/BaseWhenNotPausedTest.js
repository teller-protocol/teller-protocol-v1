// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Mock contracts
const BaseMock = artifacts.require("./mock/base/BaseMock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract('BaseWhenNotPausedTest', function (accounts) {
    const owner = accounts[0];
    let settings;
    let instance;
    
    beforeEach('Setup for each test', async () => {
        settings = await Settings.new(1, 1);
        instance = await BaseMock.new(settings.address);
    });

    withData({
        _1_notPaused: [false, undefined, false],
        _2_paused: [true, 'PLATFORM_OR_POOL_IS_PAUSED', true],
    }, function(callPause, expectedErrorMessage,mustFail) {
        it(t('user', 'externalWhenNotPaused / Platform', 'Should (or not) be able to call function when it is/isnt paused.', mustFail), async function() {
            // Setup
            if (callPause) {
                await settings.pause({ from: owner });
            }

            try {
                // Invocation
                const result = await instance.externalWhenNotPaused();
                
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
        _1_notPaused: [1, 2, false, undefined, false],
        _2_paused: [2, 2, true, 'PLATFORM_OR_POOL_IS_PAUSED', true]
    }, function(lendingIndex, senderIndex, callPause, expectedErrorMessage,mustFail) {
        it(t('user', 'externalWhenNotPaused / Lending', 'Should (or not) be able to call function when a lending address is/isnt paused.', mustFail), async function() {
            // Setup
            const senderAddress = accounts[senderIndex];
            const lendingPoolAddress = accounts[lendingIndex];
            if (callPause) {
                await settings.pauseLendingPool(lendingPoolAddress, { from: owner });
            }

            try {
                // Invocation
                const result = await instance.externalWhenNotPausedAn(lendingPoolAddress, { from: senderAddress });
                
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