// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../../utils/consts');

// Mock contracts
const ChainlinkAggregatorMock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");

contract('ChainlinkPairAggregatorInitializeTest', function (accounts) {
    let chainlinkAggregator;
    
    beforeEach('Setup for each test', async () => {
        chainlinkAggregator = await ChainlinkAggregatorMock.new();
    });

    withData({
        _1_basic: [true, false, 18, 18, undefined, false],
        _2_empty_chainlink: [false, false, 0, 18, 'AGGREGATOR_NOT_CONTRACT', true],
        _3_zero_response_decimals: [true, false, 0, 18, undefined, false],
        _4_zero_collateral_decimals: [true, false, 18, 0, undefined, false],
        _5_zero_decimals: [true, false, 0, 0, undefined, false],
        _6_big_diff: [true, false, 5, 56, 'MAX_PENDING_DECIMALS_EXCEEDED', true]
    }, function(
        createChainlinkInstance,
        isInverse,
        responseDecimals,
        collateralDecimals,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) able to create a new instance.', mustFail), async function() {
            // Setup
            const chainlinkAddress = createChainlinkInstance ? chainlinkAggregator.address : NULL_ADDRESS;
            const instance = await ChainlinkPairAggregator.new();

            try {
                // Invocation
                const result = await instance.initialize(
                    chainlinkAddress,
                    isInverse,
                    responseDecimals,
                    collateralDecimals
                    );
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                assert(instance.address);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});