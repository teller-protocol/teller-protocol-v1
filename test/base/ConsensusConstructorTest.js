// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Smart contracts
const Consensus = artifacts.require("./base/Consensus.sol");

contract('ConsensusConstructorTest', function () {

    withData({
        _1_reqsubs0_tolerance0: [0, 0, 'VALUE_MUST_BE_PROVIDED', true],
        _2_reqsubs1_tolerance0: [1, 0, undefined, false],
        _3_reqsubs1_tolerance1: [1, 1, undefined, false],
        _4_reqsubs0_tolerance1: [0, 1, 'VALUE_MUST_BE_PROVIDED', true],
    }, function(
        requiredSubmissions,
        maximumTolerance,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            try {
                // Invocation
                const result = await Consensus.new(
                    requiredSubmissions,
                    maximumTolerance,
                );
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                assert(result.address);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});