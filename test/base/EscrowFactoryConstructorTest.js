// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Smart contracts
const Escrow = artifacts.require("./base/Escrow.sol");
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");

contract('EscrowFactoryConstructorTest', async function (accounts) {
    withData({
        _1_basic: [undefined, false],
    }, function(expectedErrorMessage, mustFail) {
        it(t('user', 'new', 'Should be able to create a new instance.', mustFail), async function() {
            // Setup

            try {
                // Invocation
                const escrow = await Escrow.new();
                const result = await EscrowFactory.new(escrow.address);

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
