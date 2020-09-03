// JS Libraries
const withData = require('leche').withData;
const { t } = require('../../utils/consts');
const AggregatorInterfaceEncoder = require('../../utils/encoders/AggregatorInterfaceEncoder');

// Mock contracts
const ChainlinkAggregatorMock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");

contract('ChainlinkPairAggregatorGetLatestRoundTest', function (accounts) {
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
        _1_basic: [210000]
    }, function(
        latestRoundResponse
    ) {    
        it(t('user', 'getLatestRound', 'Should able to get the last round.', false), async function() {
            // Setups
            await chainlinkAggregator.givenMethodReturnUint(
                aggregatorInterfaceEncoder.encodeLatestRound(),
                latestRoundResponse.toString()
            );

            // Invocation
            const result = await instance.getLatestRound();

            // Assertions
            assert.equal(result.toString(), latestRoundResponse.toString());
        });
    });
});