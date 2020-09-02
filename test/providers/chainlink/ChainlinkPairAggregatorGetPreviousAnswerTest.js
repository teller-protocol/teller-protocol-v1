// JS Libraries
const withData = require('leche').withData;
const BigNumber = require('bignumber.js');
const { t } = require('../../utils/consts');
const AggregatorInterfaceEncoder = require('../../utils/encoders/AggregatorInterfaceEncoder');

// Mock contracts
const ChainlinkAggregatorMock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/ChainlinkPairAggregator.sol");

contract('ChainlinkPairAggregatorGetPreviousAnswerTest', function (accounts) {
    BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: 3 });
    const aggregatorInterfaceEncoder = new AggregatorInterfaceEncoder(web3);
    let chainlinkAggregator;
    
    beforeEach('Setup for each test', async () => {
        chainlinkAggregator = await ChainlinkAggregatorMock.new();
    });

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

    withData({
        // LINK => 18 decimals, oracle response => 8 decimals, 1 USD = 4.033 (or 403300000 -8 decimals-)
        _1_inverse_link_usd: [2, 3, true, 8, 8, "403300000", undefined, false],
        // TokenB => 10 decimals, oracle response => 5 decimals, 1 USD = 3.50607 (or 350607 -5 decimals-)
        _2_inverse_usd_tokenB: [3, 3, true, 5, 5, "350607", undefined, false],
        // TokenB => 10 decimals, oracle response => 12 decimals, 1 USD = 43.500600700800 TokenB (or 43500600700800 -12 decimals-)
        _3_inverse_usd_tokenB: [5, 3, true, 12, 12, "43500600700800", 'NOT_ENOUGH_HISTORY', true],
        // TokenC => 10 decimals, oracle response => 10 decimals, 1 USD = 12.0030405060 TokenB (or 120030405060 -10 decimals-)
        _4_inverse_usd_tokenC: [0, 3, true, 10, 10, "120030405060", undefined, false],
        _5_not_inverse_basic: [3, 5, false, 18, 18, '120000000000000000000', undefined, false],
        _6_not_inverse_zeroDays: [0, 6, false, 18, 18, '1200000000000000000', undefined, false],
        _7_not_inverse_notHistory: [8, 5, false, 18, 18, '2000000000000000000', 'NOT_ENOUGH_HISTORY', true]
    }, function(
        roundsBack,
        latestRoundResponse,
        isInverse,
        responseDecimals,
        collateralDecimals,
        latestAnswerResponse,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'getPreviousAnswer', 'Should able (or not) to get a previous price.', mustFail), async function() {
            // Setup
            const latestRoundEncodeAbi = aggregatorInterfaceEncoder.encodeLatestRound();
            await chainlinkAggregator.givenMethodReturnUint(latestRoundEncodeAbi, latestRoundResponse.toString());

            const getAnswerEncodeAbi = aggregatorInterfaceEncoder.encodeGetAnswer();
            await chainlinkAggregator.givenMethodReturnUint(getAnswerEncodeAbi, latestAnswerResponse.toString());

            const expectedLatestAnswer = getExpectedAnswer(isInverse, latestAnswerResponse, responseDecimals, collateralDecimals);
            const instance = await ChainlinkPairAggregator.new();
            await instance.initialize(
                chainlinkAggregator.address,
                isInverse,
                responseDecimals,
                collateralDecimals
            );

            try {
                // Invocation
                const result = await instance.getPreviousAnswer(roundsBack);
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert.equal(result.toString(), expectedLatestAnswer.toString());
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