// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const PairAggregatorEncoder = require('../utils/encoders/PairAggregatorEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/LoansMock.sol");

contract('LoansIsCollateralSentEnoughTest', function (accounts) {
    const pairAggregatorEncoder = new PairAggregatorEncoder(web3);
    const { utils } = web3;
    const sender = accounts[0];
    let instance;
    let oracleInstance;
    let lendingPoolInstance;
    
    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        oracleInstance = await Mock.new();
        instance = await Loans.new(
            oracleInstance.address,
            lendingPoolInstance.address,
        );
    });

    withData({
        _1_case: [5099080000000000, 1500, 600, 0.2, false],
        _2_case: [5099080000000000, 1500, 300, 2.3, true],
        _3_case: [5099080000000000, 4000, 900, 18.356, false],
        _4_case: [5099080000000000, 300, 10, 0.3, true],
        _5_case: [5099080000000000, 100, 10, 0.0, false],
        _6_case: [5203535000000000, 100, 10, 0.0, false],
        _7_case: [5203535000000000, 6000, 600, 20, true],
        _8_case: [5203535000000000, 2000, 700, 7, false],
        _9_case: [5203535000000000, 10000, 300, 16, true],
        _10_case: [5203535000000000, 7500, 50, 1.952, true],
        _11_case: [5273400000000000, 500, 950, 2, false],
        _12_case: [5273400000000000, 3000, 1400, 22.15, true],
        _13_case: [5273400000000000, 4200, 1000, 22.14, false],
        _14_case: [5273400000000000, 3400, 0, 0, true],
        _15_case: [5273400000000000, 1000, 100, 1, true],
    }, function(lastestAnswer, amountToBorrow, collateralRatio, amountEther, expectedEnoughCollateral) {
        it(t('user', 'isCollateralSentEnough', 'Should able to test collateral sent.', false), async function() {
            // Setup
            const amountWei = utils.toWei(amountEther.toString(), 'ether');
            const encodeGetLatestAnswer = pairAggregatorEncoder.encodeGetLatestAnswer();
            await oracleInstance.givenMethodReturnUint(encodeGetLatestAnswer, lastestAnswer.toString());

            // Invocation
            const result = await instance.externalIsCollateralSentEnough(
                amountWei.toString(),
                amountToBorrow,
                collateralRatio,
                {
                    from: sender,
                }
            );

            // Assertions
            assert.equal(result.toString(), expectedEnoughCollateral.toString());
        });
    });
});