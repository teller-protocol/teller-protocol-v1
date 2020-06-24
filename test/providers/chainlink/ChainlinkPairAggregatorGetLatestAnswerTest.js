// JS Libraries
const withData = require('leche').withData;
const { t } = require('../../utils/consts');
const AggregatorInterfaceEncoder = require('../../utils/encoders/AggregatorInterfaceEncoder');

// Mock contracts
const ChainlinkAggregatorMock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");

contract('ChainlinkPairAggregatorGetLatestAnswerTest', function (accounts) {
    const aggregatorInterfaceEncoder = new AggregatorInterfaceEncoder(web3);
    let chainlinkAggregator;
    
    beforeEach('Setup for each test', async () => {
        chainlinkAggregator = await ChainlinkAggregatorMock.new();
    });

    withData({
        _1_coll18_response18: [ChainlinkPairAggregator, 18, 18, 1000000, 1000000],
        _2_coll18_response10: [ChainlinkPairAggregator, 18, 10, 3100000, 310000000000000],
        _3_coll18_response18: [ChainlinkPairAggregator, 18, 18, 25000000000000000000, 25000000000000000000],
        _4_coll10_response18: [ChainlinkPairAggregator, 10, 18, 25000000000000, 250000],
    }, function(aggregatorReference, collateralDecimals, responseDecimals, latestAnswerResponse, expectedLatestAnswerResponse) {
        it(t('user', 'getLatestAnswer', 'Should able to get the last price.', false), async function() {
            // Setup
            const instance = await aggregatorReference.new(chainlinkAggregator.address, responseDecimals, collateralDecimals);
            // Mocking response for aggregator 'lastAnswer' function.
            await chainlinkAggregator.givenMethodReturnUint(
                aggregatorInterfaceEncoder.encodeLatestAnswer(),
                latestAnswerResponse.toString()
            );

            // Invocation
            const result = await instance.getLatestAnswer();

            // Assertions
            assert.equal(result.toString(), expectedLatestAnswerResponse.toString());
        });
    });
});