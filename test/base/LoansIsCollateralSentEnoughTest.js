// JS Libraries
const BigNumber = require('bignumber.js');
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const PairAggregatorEncoder = require('../utils/encoders/PairAggregatorEncoder');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/LoansMock.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");

contract('LoansIsCollateralSentEnoughTest', function (accounts) {
    const pairAggregatorEncoder = new PairAggregatorEncoder(web3);
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const { utils } = web3;
    const sender = accounts[0];
    let instance;
    let lendingToken;
    let oracleInstance;
    let lendingPoolInstance;
    
    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await LendingPool.new();
        oracleInstance = await Mock.new();
        instance = await Loans.new(
            oracleInstance.address,
            lendingPoolInstance.address,
        );
        const zToken = await Mock.new();
        lendingToken = await Mock.new();
        const lenders = await Mock.new();
        const settings = await Mock.new();
        await lendingPoolInstance.initialize(
            zToken.address,
            lendingToken.address,
            lenders.address,
            instance.address,
            settings.address,
        );
    });

    withData({
        _1_case: [5099080000000000, 18, 1500, 6000, 0.2, false],
        _2_case: [5099080000000000, 18, 1500, 3000, 2.3, true],
        _3_case: [5099080000000000, 18, 4000, 9000, 18.356, false],
        _4_case: [5099080000000000, 18, 300, 100, 0.3, true],
        _5_case: [5099080000000000, 18, 100, 100, 0.0, false],
        _6_case: [5203535000000000, 18, 100, 100, 0.0, false],
        _7_case: [5203535000000000, 18, 6000, 6000, 20, true],
        _8_case: [5203535000000000, 18, 2000, 7000, 7, false],
        _9_case: [5203535000000000, 6, 10000, 3000, 16, true],
        _10_case: [5203535000000000, 6, 7500, 500, 1.952, true],
        _11_case: [5273400000000000, 6, 500, 9500, 2, false],
        _12_case: [5273400000000000, 6, 3000, 14000, 22.15, true],
        _13_case: [5273400000000000, 6, 4200, 10000, 22.14, false],
        _14_case: [5273400000000000, 6, 3400, 0, 0, true],
        _15_case: [5273400000000000, 6, 1000, 1000, 1, true],
    }, function(lastestAnswer, amountToBorrowDecimals, amountToBorrowInt, collateralRatio, amountEther, expectedEnoughCollateral) {
        it(t('user', 'isCollateralSentEnough', 'Should able to test collateral sent.', false), async function() {
            // Setup
            const amountToBorrow = new BigNumber(amountToBorrowInt).times(new BigNumber(10).pow(amountToBorrowDecimals));
            const amountWei = utils.toWei(amountEther.toString(), 'ether');
            const encodeGetLatestAnswer = pairAggregatorEncoder.encodeGetLatestAnswer();
            await oracleInstance.givenMethodReturnUint(encodeGetLatestAnswer, lastestAnswer.toString());
            const encodeDecimals = erc20InterfaceEncoder.encodeDecimals();
            await lendingToken.givenMethodReturnUint(encodeDecimals, amountToBorrowDecimals);

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