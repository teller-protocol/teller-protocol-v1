// JS Libraries
const withData = require('leche').withData;
const BigNumber = require('bignumber.js');
const { t } = require('../../utils/consts');
const AggregatorInterfaceEncoder = require('../../utils/encoders/AggregatorInterfaceEncoder');

// Mock contracts
const ChainlinkAggregatorMock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ChainlinkPairAggregator = artifacts.require("./providers/chainlink/InverseChainlinkPairAggregator.sol");

contract('InverseChainlinkPairAggregatorGetLatestAnswerTest', function (accounts) {
    BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: 3 });
    const aggregatorInterfaceEncoder = new AggregatorInterfaceEncoder(web3);
    let chainlinkAggregator;
    
    beforeEach('Setup for each test', async () => {
        chainlinkAggregator = await ChainlinkAggregatorMock.new();
    });

    const getExpectedAnswer = (value, collateralDecimals, responseDecimals) => {
        const wholeCollateral = (new BigNumber(10).pow(collateralDecimals));
        const wholeResponse = (new BigNumber(10).pow(responseDecimals));
        return wholeCollateral.times(wholeResponse).div(BigNumber(value.toString()));
    };

    withData({
        // LINK => 18 decimals, oracle response => 8 decimals, 1 USD = 4.033 (or 403300000 -8 decimals-)
        _1_link_usd: [8, 8, "403300000"],
        // TokenB => 10 decimals, oracle response => 5 decimals, 1 USD = 3.50607 (or 350607 -5 decimals-)
        _2_usd_tokenB: [5, 10, "350607"],
        // TokenB => 10 decimals, oracle response => 12 decimals, 1 USD = 43.500600700800 TokenB (or 43500600700800 -12 decimals-)
        _3_usd_tokenB: [12, 10, "43500600700800"],
        // TokenC => 10 decimals, oracle response => 10 decimals, 1 USD = 12.0030405060 TokenB (or 120030405060 -10 decimals-)
        _4_usd_tokenC: [10, 5, "120030405060"],
        // TokenD => 10 decimals, oracle response => 10 decimals, 1 USD = 12.0030405060 TokenB (or 120030405060 -10 decimals-)
        _5_usd_tokenD: [5, 10, "120030405060"],
    }, function(collateralDecimals, responseDecimals, latestAnswerResponse) {
        it(t('user', 'getLatestAnswer', 'Should able to get the last price.', false), async function() {
            // Setup
            const expectedLatestAnswer = getExpectedAnswer(latestAnswerResponse, collateralDecimals, responseDecimals);
            const instance = await ChainlinkPairAggregator.new(chainlinkAggregator.address, responseDecimals, collateralDecimals);
            await chainlinkAggregator.givenMethodReturnUint(
                aggregatorInterfaceEncoder.encodeLatestAnswer(),
                latestAnswerResponse.toString()
            );

            // Invocation
            const result = await instance.getLatestAnswer();

            // Assertions
            assert.equal(result.toString(), expectedLatestAnswer.toFixed(0));
        });
    });
});