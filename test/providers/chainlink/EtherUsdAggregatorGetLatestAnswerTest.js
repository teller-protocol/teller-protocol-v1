// JS Libraries
const withData = require('leche').withData;
const { t } = require('../../utils/consts');
const AggregatorInterfaceEncoder = require('../../utils/encoders/AggregatorInterfaceEncoder');

// Mock contracts
const ChainlinkAggregatorMock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const EtherUsdAggregator = artifacts.require("./providers/chainlink/EtherUsdAggregator.sol");

contract('EtherUsdAggregatorGetLatestAnswerTest', function (accounts) {
    const aggregatorInterfaceEncoder = new AggregatorInterfaceEncoder(web3);
    let chainlinkAggregator;
    let instance;
    
    beforeEach('Setup for each test', async () => {
        chainlinkAggregator = await ChainlinkAggregatorMock.new();
        assert(chainlinkAggregator);
        assert(chainlinkAggregator.address);

        instance = await EtherUsdAggregator.new(chainlinkAggregator.address);
        assert(instance);
        assert(instance.address);
    });

    withData({
        _1_basic: [1000000]
    }, function(
        latestAnswerResponse
    ) {    
        it(t('user', 'getLatestAnswer', 'Should able to get the last price.', false), async function() {
            // Setup
            // Mocking response for aggregator 'lastAnswer' function.
            await chainlinkAggregator.givenMethodReturnUint(
                aggregatorInterfaceEncoder.encodeLatestAnswer(),
                latestAnswerResponse.toString()
            );

            // Invocation
            const result = await instance.getLatestAnswer();

            // Assertions
            assert.equal(result.toString(), latestAnswerResponse.toString());
        });
    });
});