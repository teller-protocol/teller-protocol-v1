// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../../utils/consts');
const AggregatorInterfaceEncoder = require('../../utils/encoders/AggregatorInterfaceEncoder');

// Mock contracts
const ChainlinkAggregatorMock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const EtherUsdAggregator = artifacts.require("./providers/chainlink/EtherUsdAggregator.sol");

contract('EtherUsdAggregatorGetLatestTimestampTest', function (accounts) {
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
        _1_basic: [new Date(2020, 01, 01).getTime()],
        _2_now: [new Date().getTime()]
    }, function(latestTimestampResponse) {
        it(t('user', 'getLatestTimestamp', 'Should able to get the last timestamp.', false), async function() {
            // Setup
            const latestTimestampEncodeAbi = aggregatorInterfaceEncoder.encodeLatestTimestamp();
            await chainlinkAggregator.givenMethodReturnUint(latestTimestampEncodeAbi, latestTimestampResponse.toString());

            // Invocation
            const result = await instance.getLatestTimestamp();

            // Assertions
            assert.equal(result.toString(), latestTimestampResponse.toString());
        });
    });
});