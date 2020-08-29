// JS Libraries
const withData = require('leche').withData;
const BigNumber = require('bignumber.js');
const { t } = require('../../utils/consts');
const AggregatorInterfaceEncoder = require('../../utils/encoders/AggregatorInterfaceEncoder');

// Mock contracts
const ChainlinkAggregatorMock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");

contract('ChainlinkPairAggregatorGetLatestAnswerTest', function (accounts) {
    BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: 3 });
    const aggregatorInterfaceEncoder = new AggregatorInterfaceEncoder(web3);
    let chainlinkAggregator;

    const getExpectedAnswer = (isInverse, value, collateralDecimals, responseDecimals) => {
        if(isInverse) {
            const wholeCollateral = (new BigNumber(10).pow(collateralDecimals));
            const wholeResponse = (new BigNumber(10).pow(responseDecimals));
            return wholeCollateral.times(wholeResponse).div(BigNumber(value.toString()));
        } else {
            const collateralGTresponse = collateralDecimals >= responseDecimals;
            const pendingDecimals =  collateralGTresponse ? collateralDecimals - responseDecimals : responseDecimals - collateralDecimals;
            const tenPowPendingDecimals = (new BigNumber(10).pow(pendingDecimals));

            if(collateralGTresponse) {
                return BigNumber(value.toString()).times(tenPowPendingDecimals);
            } else {
                return BigNumber(value.toString()).div(tenPowPendingDecimals);
            }
        }
    };
    
    beforeEach('Setup for each test', async () => {
        chainlinkAggregator = await ChainlinkAggregatorMock.new();
    });

    withData({
        _1_not_inverse_coll18_response18: [false, 18, 18, '1000000'],
        _2_not_inverse_coll18_response10: [false, 18, 10, '3100000'],
        _3_not_inverse_coll18_response18: [false, 18, 18, '25000000000000000000'],
        _4_not_inverse_coll10_response18: [false, 10, 18, '25000000000000'],
        // LINK => 18 decimals, oracle response => 8 decimals, 1 USD = 4.033 (or 403300000 -8 decimals-)
        _5_inverse_link_usd: [true, 8, 8, "403300000"],
        // TokenB => 10 decimals, oracle response => 5 decimals, 1 USD = 3.50607 (or 350607 -5 decimals-)
        _6_inverse_usd_tokenB: [true, 5, 10, "350607"],
        // TokenB => 10 decimals, oracle response => 12 decimals, 1 USD = 43.500600700800 TokenB (or 43500600700800 -12 decimals-)
        _7_inverse_usd_tokenB: [true, 12, 10, "43500600700800"],
        // TokenC => 10 decimals, oracle response => 10 decimals, 1 USD = 12.0030405060 TokenB (or 120030405060 -10 decimals-)
        _8_inverse_usd_tokenC: [true, 10, 5, "120030405060"],
        // TokenD => 10 decimals, oracle response => 10 decimals, 1 USD = 12.0030405060 TokenB (or 120030405060 -10 decimals-)
        _9_inverse_usd_tokenD: [true, 5, 10, "120030405060"],
    }, function(
        isInverse,
        collateralDecimals,
        responseDecimals,
        latestAnswerResponse
    ) {
        it(t('user', 'getLatestAnswer', 'Should able to get the last price.', false), async function() {
            // Setup
            const expectedLatestAnswer = getExpectedAnswer(isInverse, latestAnswerResponse, collateralDecimals, responseDecimals);
            const instance = await ChainlinkPairAggregator.new();
            await instance.initialize(
                chainlinkAggregator.address,
                isInverse,
                responseDecimals,
                collateralDecimals
            );
            // Mocking response for aggregator 'lastAnswer' function.
            await chainlinkAggregator.givenMethodReturnUint(
                aggregatorInterfaceEncoder.encodeLatestAnswer(),
                latestAnswerResponse.toString()
            );

            // Invocation
            const result = await instance.getLatestAnswer();

            // Assertions
            assert.equal(result.toString(), expectedLatestAnswer.toString());
        });
    });
});