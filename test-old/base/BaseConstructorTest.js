// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts

// Smart contracts
const Base = artifacts.require("./base/Base.sol");

contract('BaseConstructorTest', function (accounts) {

    withData({
        _1_basic: [undefined, false],
    }, function(expectedErrorMessage, mustFail) {
        it(t('user', 'new', 'Should be able to create a new instance.', mustFail), async function() {
            // Setup

            try {
                // Invocation
                const result = await Base.new();
                
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