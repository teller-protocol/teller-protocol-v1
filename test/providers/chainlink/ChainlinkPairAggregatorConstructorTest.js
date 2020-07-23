// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../../utils/consts');

// Mock contracts
const ChainlinkAggregatorMock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");

contract('ChainlinkPairAggregatorConstructorTest', function (accounts) {
    let chainlinkAggregator;
    
    beforeEach('Setup for each test', async () => {
        chainlinkAggregator = await ChainlinkAggregatorMock.new();
    });

    withData({
        _1_basic: [true, 18, 18, undefined, false],
        _2_emptyChainlink: [false, 0, 18, 'PROVIDE_AGGREGATOR_ADDRESS', true],
        _3_zeroResponseDecimals: [true, 0, 18, undefined, false],
        _4_zeroCollateralDecimals: [true, 18, 0, undefined, false],
        _5_zeroDecimals: [true, 0, 0, undefined, false],
        _6_big_diff: [true, 5, 56, 'MAX_PENDING_DECIMALS_EXCEEDED', true]
    }, function(
        createChainlinkInstance,
        responseDecimals,
        collateralDecimals,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) able to create a new instance.', mustFail), async function() {
            // Setup
            const chainlinkAddress = createChainlinkInstance ? chainlinkAggregator.address : NULL_ADDRESS;

            try {
                // Invocation
                const result = await ChainlinkPairAggregator.new(chainlinkAddress, responseDecimals, collateralDecimals);
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                assert(result.address);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});