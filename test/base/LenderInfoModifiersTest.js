// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts

// Smart contracts
const LenderInfo = artifacts.require("./mock/base/LenderInfoModifiersMock.sol");

contract('LenderInfoZDaiMintedTest', function (accounts) {
    
    beforeEach('Setup for each test', async () => { });

    withData({
        _1_zdaiSender: [accounts[0], accounts[1], accounts[0], undefined, false],
        _2_daiPoolSender: [accounts[0], accounts[1], accounts[1], 'Address has no permissions.', true],
        _3_notValidSender: [accounts[0], accounts[1], accounts[2], 'Address has no permissions.', true],
    }, function(
        zdaiAddress,
        daiPoolAddress,
        sender,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'isZDai', 'Should able (or not) to call function with modifier isZDai.', mustFail), async function() {
            // Setup
            const instance = await LenderInfo.new(zdaiAddress, daiPoolAddress);

            try {
                // Invocation
                const result = await instance.externalIsZDai({ from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because the sender has no permissions.');
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
        _1_zdaiSender: [accounts[0], accounts[1], accounts[1], undefined, false],
        _2_daiPoolSender: [accounts[0], accounts[1], accounts[0], 'Address has no permissions.', true],
        _3_notValidSender: [accounts[0], accounts[1], accounts[2], 'Address has no permissions.', true],
    }, function(
        zdaiAddress,
        daiPoolAddress,
        sender,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'isDaiPool', 'Should able (or not) to call function with modifier isDaiPool.', mustFail), async function() {
            // Setup
            const instance = await LenderInfo.new(zdaiAddress, daiPoolAddress);

            try {
                // Invocation
                const result = await instance.externalIsDaiPool({ from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because the sender has no permissions.');
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
        _1_validAddress: [accounts[0], accounts[1], accounts[1], undefined, false],
        _2_invalidAddress: [accounts[0], accounts[1], NULL_ADDRESS, 'Address is required.', true],
    }, function(
        zdaiAddress,
        daiPoolAddress,
        sender,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'isValid', 'Should able (or not) to call function with modifier isValid.', mustFail), async function() {
            // Setup
            const instance = await LenderInfo.new(zdaiAddress, daiPoolAddress);

            try {
                // Invocation
                const result = await instance.externalIsValid(sender);

                // Assertions
                assert(!mustFail, 'It should have failed because the address is invalid/empty.');
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