// JS Libraries
const withData = require('leche').withData;
const { t } = require('../../utils/consts');
const AggregatorInterfaceEncoder = require('../../utils/encoders/AggregatorInterfaceEncoder');

// Mock contracts
const ChainlinkAggregatorMock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");

contract('ChainlinkPairAggregatorGetPreviousAnswerTest', function (accounts) {
    const aggregatorInterfaceEncoder = new AggregatorInterfaceEncoder(web3);
    let chainlinkAggregator;
    let instance;
    
    beforeEach('Setup for each test', async () => {
        chainlinkAggregator = await ChainlinkAggregatorMock.new();
        assert(chainlinkAggregator);
        assert(chainlinkAggregator.address);

        instance = await ChainlinkPairAggregator.new();
        instance.initialize(
            chainlinkAggregator.address,
            false,
            18,
            18
        );
        assert(instance);
        assert(instance.address);
    });

    withData({
        _1_basic: [5, 120, 3, undefined, false],
        _2_zeroDays: [6, 120, 0, undefined, false],
        _3_notHistory: [5, 120, 8, 'NOT_ENOUGH_HISTORY', true]
    }, function(
        latestRoundResponse,
        getAnswerResponse,
        backTimestamp,
        expectedErrorMessage,
        mustFail,
    ) {    
        it(t('user', 'getPreviousAnswer', 'Should able (or not) to get the previous price.', mustFail), async function() {
            // Setup
            const latestRoundEncodeAbi = aggregatorInterfaceEncoder.encodeLatestRound();
            await chainlinkAggregator.givenMethodReturnUint(latestRoundEncodeAbi, latestRoundResponse.toString());

            const getAnswerEncodeAbi = aggregatorInterfaceEncoder.encodeGetAnswer();
            await chainlinkAggregator.givenMethodReturnUint(getAnswerEncodeAbi, getAnswerResponse.toString());

            try {
                // Invocation
                const result = await instance.getPreviousAnswer(backTimestamp);
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert(error.message.includes(expectedErrorMessage));
            }
        });
    });
});