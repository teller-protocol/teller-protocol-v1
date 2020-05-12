// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Smart contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const InterestConsensus = artifacts.require("./base/InterestConsensus.sol");
const Lenders = artifacts.require("./base/Lenders.sol");

contract('InterestConsensusInitializeTest', function (accounts) {

    withData({
        _1_no_settings: [true, false, 'MUST_PROVIDE_SETTINGS', true],
        _2_no_lenders: [false, true, 'MUST_PROVIDE_LENDER_INFO', true],
        _3_all_provided: [true, true, undefined, false],
    }, function(
        provideLenders,
        provideSettings,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            try {
                // Setup
                const instance = await InterestConsensus.new();
                const settings = await Mock.new();
                const lenders = await Lenders.new(accounts[1], accounts[2], instance.address);
                const lendersAddress = provideLenders ? lenders.address : NULL_ADDRESS;
                const settingsAddress = provideSettings ? settings.address : NULL_ADDRESS;

                let result = await instance.initialize(
                    lendersAddress,
                    settingsAddress,
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