// JS Libraries
const withData = require('leche').withData;
const { t, THIRTY_DAYS } = require('../utils/consts');

// Smart contracts
const Consensus = artifacts.require("./base/ConsensusModifiersMock.sol");

contract('ConsensusModifiersTest', function (accounts) {
    const reqSubmissions = 1
    const maxTolerance = 1

    withData({
        _1_not_lenders: [accounts[1], accounts[3], 'Address has no permissions.', true],
        _2_lenders: [accounts[1], accounts[1], undefined, false]
    }, function(
        callerAddress,
        msgSender,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) be able to call the function', mustFail), async function() {
            try {
                // Setup
                const instance = await Consensus.new();
                await instance.initialize(
                    callerAddress,
                    reqSubmissions,
                    maxTolerance,
                    THIRTY_DAYS
                )

                const result = await instance.externalIsCaller({ from:  msgSender })

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});