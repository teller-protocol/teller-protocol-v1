// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Smart contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const InterestConsensus = artifacts.require("./base/InterestConsensus.sol");
const Lenders = artifacts.require("./base/Lenders.sol");

contract('InterestConsensusInitializeTest', function (accounts) {

    withData({
        _1_no_settings: [2, -1, 4, 'SETTINGS_MUST_BE_PROVIDED', true],
        _2_no_lenders: [-1, 5, 3, 'MUST_PROVIDE_LENDER_INFO', true],
        _3_all_provided: [2, 3, 4, undefined, false],
        _4_no_markets: [5, 2, -1, 'MARKETS_MUST_BE_PROVIDED', true],
        _5_no_markets_contract: [5, 2, 99, 'MARKETS_MUST_BE_A_CONTRACT', true],
    }, function(
        lendersIndex,
        settingsIndex,
        marketsIndex,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            try {
                // Setup
                const instance = await InterestConsensus.new();
                const settings = await Mock.new();
                const markets = await Mock.new();
                const lenders = await Lenders.new();
                const lendersAddress = lendersIndex === -1 ? NULL_ADDRESS: lendersIndex === 99 ? accounts[2] : lenders.address;
                const settingsAddress = settingsIndex === -1 ? NULL_ADDRESS: settingsIndex === 99 ? accounts[3] : settings.address;
                const marketsAddress = marketsIndex === -1 ? NULL_ADDRESS: marketsIndex === 99 ? accounts[4] : markets.address;

                let result = await instance.initialize(
                    lendersAddress,
                    settingsAddress,
                    marketsAddress,
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