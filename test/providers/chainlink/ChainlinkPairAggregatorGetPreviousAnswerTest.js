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
    const aggregatorInterfaceEncoder = new AggregatorInterfaceEncoder(web3);
    let chainlinkAggregator;

    beforeEach('Setup for each test', async () => {
        chainlinkAggregator = await ChainlinkAggregatorMock.new();
    });

    const getExpectedAnswer = (value, collateralDecimals, responseDecimals, isInverse) => {
        value = new BigNumber(value);
        if (isInverse) {
            const wholeCollateral = new BigNumber(10).pow(collateralDecimals);
            const wholeResponse = new BigNumber(10).pow(responseDecimals);
            return wholeCollateral.times(wholeResponse).div(value);
        } else {
            if (collateralDecimals >= responseDecimals) {
                return value.times(new BigNumber(10).pow(new BigNumber(collateralDecimals).minus(responseDecimals)));
            } else {
                return value.div(new BigNumber(10).pow(new BigNumber(responseDecimals).minus(collateralDecimals)));
            }
        }
    };

    withData({
        _1_basic: [3, 5, false, 18, 18, 120, undefined, false],
        _2_zero_days: [0, 6, false, 18, 18, 120, undefined, false],
        _3_not_history: [8, 5, false, 18, 18, 120, 'NOT_ENOUGH_HISTORY', true],
        // LINK => 18 decimals, oracle response => 8 decimals, 1 USD = 4.033 (or 403300000 -8 decimals-)
        _4_link_usd: [2, 3, true, 8, 18, "403300000", undefined, false],
        _5_usd_tokenC: [0, 3, true, 10, 10, "120030405060", undefined, false],
    }, function(
        roundsBack,
        latestRoundResponse,
        isInverse,
        responseDecimals,
        collateralDecimals,
        latestAnswerResponse,
        expectedErrorMessage,
        mustFail,
    ) {    
        it(t('user', 'getPreviousAnswer', 'Should able (or not) to get the previous price.', mustFail), async function() {
            // Setup
            const latestRoundEncodeAbi = aggregatorInterfaceEncoder.encodeLatestRound();
            await chainlinkAggregator.givenMethodReturnUint(latestRoundEncodeAbi, latestRoundResponse.toString());

            const getAnswerEncodeAbi = aggregatorInterfaceEncoder.encodeGetAnswer();
            await chainlinkAggregator.givenMethodReturnUint(getAnswerEncodeAbi, latestAnswerResponse.toString());

            const expectedLatestAnswer = getExpectedAnswer(latestAnswerResponse, collateralDecimals, responseDecimals, isInverse);
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