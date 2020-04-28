// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Smart contracts
const InterestConsensus = artifacts.require("./base/InterestConsensus.sol");
const Lenders = artifacts.require("./base/Lenders.sol");

contract('InterestConsensusInitializeTest', function (accounts) {

    withData({
        _1_no_reqsubmissions: [true, 0, 1, 'MUST_PROVIDE_REQUIRED_SUBS', true],
        _2_no_lenders: [false, 1, 1, 'MUST_PROVIDE_LENDER_INFO', true],
        _3_no_maxtolerance: [true, 1, 0, undefined, false],
        _4_all_provided: [true, 1, 1, undefined, false],
    }, function(
        provideLenders,
        requiredSubmissions,
        maximumTolerance,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            try {
                // Setup
                const instance = await InterestConsensus.new();
                const lenders = await Lenders.new(accounts[1], accounts[2], instance.address)
                const lendersAddress = provideLenders ? lenders.address : NULL_ADDRESS

                let result = await instance.initialize(
                    lendersAddress,
                    requiredSubmissions,
                    maximumTolerance
                )

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