// JS Libraries
const withData = require('leche').withData;
const BigNumber = require('bignumber.js');
const { t } = require('../../utils/consts');
const AggregatorInterfaceEncoder = require('../../utils/encoders/AggregatorInterfaceEncoder');

// Mock contracts
const ChainlinkAggregatorMock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/InverseChainlinkPairAggregator.sol");

contract('InverseChainlinkPairAggregatorGetPreviousAnswerTest', function (accounts) {
    BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: 3 });
    const aggregatorInterfaceEncoder = new AggregatorInterfaceEncoder(web3);
    let chainlinkAggregator;
    
    beforeEach('Setup for each test', async () => {
        chainlinkAggregator = await ChainlinkAggregatorMock.new();
    });

    const getExpectedAnswer = (value, responseDecimals, collateralDecimals) => {
        const wholeResponse = (new BigNumber(10).pow(responseDecimals));
        const wholeCollateral = (new BigNumber(10).pow(collateralDecimals));
        return wholeCollateral.times(wholeResponse).div(BigNumber(value.toString()));
    };

    withData({
        // LINK => 18 decimals, oracle response => 8 decimals, 1 USD = 4.033 (or 403300000 -8 decimals-)
        _1_link_usd: [2, 3, true, 8, 8, "403300000", undefined, false],
        // TokenB => 10 decimals, oracle response => 5 decimals, 1 USD = 3.50607 (or 350607 -5 decimals-)
        _2_usd_tokenB: [3, 3, true, 5, 5, "350607", 'NOT_ENOUGH_HISTORY', true],
        // TokenB => 10 decimals, oracle response => 12 decimals, 1 USD = 43.500600700800 TokenB (or 43500600700800 -12 decimals-)
        _3_usd_tokenB: [5, 3, true, 12, 12, "43500600700800", 'NOT_ENOUGH_HISTORY', true],
        // TokenC => 10 decimals, oracle response => 10 decimals, 1 USD = 12.0030405060 TokenB (or 120030405060 -10 decimals-)
        _4_usd_tokenC: [0, 3, true, 10, 10, "120030405060", undefined, false],
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

            const expectedLatestAnswer = getExpectedAnswer(latestAnswerResponse, responseDecimals, collateralDecimals);
            const instance = await ChainlinkPairAggregator.new();
            instance.initialize(
                chainlinkAggregator.address,
                isInverse,
                responseDecimals,
                collateralDecimals
            );

            try {
                // Invocation
                const result = await instance.getPreviousAnswer(roundsBack);

                // Assertions
                assert.equal(result.toString(), expectedLatestAnswer.toString());
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert(error.message.includes(expectedErrorMessage));
            }
        });
    });
});