// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Smart contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const InterestConsensus = artifacts.require("./base/InterestConsensus.sol");
const Lenders = artifacts.require("./base/Lenders.sol");

contract('InterestConsensusInitializeTest', function (accounts) {

    withData({
        _1_settings_empty: [-1, 3, 'SETTINGS_MUST_BE_PROVIDED', true],
        _2_settings_not_contract: [99, 3, 'SETTINGS_MUST_BE_A_CONTRACT', true],
        _3_lenders_empty: [2, -1, 'CALLER_MUST_BE_CONTRACT', true],
        _4_lenders_not_contract: [2, 99, 'CALLER_MUST_BE_CONTRACT', true],
        _5_all_provided: [2, 3, undefined, false],
    }, function(
        settingsIndex,
        lendersIndex,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            try {
                // Setup
                const instance = await InterestConsensus.new();
                const settings = await Mock.new();
                const lenders = await Lenders.new();
                const lendersAddress = lendersIndex === -1 ? NULL_ADDRESS: lendersIndex === 99 ? accounts[2] : lenders.address;
                const settingsAddress = settingsIndex === -1 ? NULL_ADDRESS: settingsIndex === 99 ? accounts[3] : settings.address;
                const owner = accounts[0];
                let result = await instance.initialize(
                    owner,
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