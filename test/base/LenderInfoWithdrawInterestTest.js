// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { lenderInfo } = require('../utils/events');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LenderInfo = artifacts.require("./mock/base/LenderInfoMock.sol");

contract('LenderInfoWithdrawInterestTest', function (accounts) {
    let instance;
    let zdaiInstance;
    let daiPoolInstance;
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    
    beforeEach('Setup for each test', async () => {
        zdaiInstance = await Mock.new();
        daiPoolInstance = await Mock.new();
        instance = await LenderInfo.new(
            zdaiInstance.address,
            daiPoolInstance.address,
        );
    });

    withData({
        _1_10withdraw_0Interest_1blocks_20balance_10withdrawn: [accounts[0], 10, 0, 0, 1, 20, 10, 10],
        _2_50withdraw_20Interest_2blocks_15balance_Allwithdrawn: [accounts[1], 50, 10, 1, 3, 15, 40, 0],
        _3_180withdraw_100Interest_5blocks_20balance_Allwithdrawn: [accounts[2], 180, 100, 5, 10, 20, 180, 20],
    }, function(
        lenderAddress,
        amountToWithdraw,
        currentAccruedInterest,
        previousBlockAccruedInterest,
        currentBlockNumber,
        currentZDaiBalance,
        amountWithdrawnExpected,
        newAccruedInterestExpected,
    ) {    
        it(t('user', 'withdrawInterest', 'Should able to withdraw interest.', false), async function() {
            // Setup
            await instance.setCurrentBlockNumber(currentBlockNumber.toString());
            await instance.mockLenderInfo(
                lenderAddress,
                previousBlockAccruedInterest.toString(),
                currentAccruedInterest.toString()
            );
            await zdaiInstance.givenMethodReturnUint(
                erc20InterfaceEncoder.encodeBalanceOf(),
                currentZDaiBalance.toString()
            );

            // Invocation
            const result = await instance.withdrawInterest(lenderAddress, amountToWithdraw);

            // Assertions
            assert(result);
            lenderInfo
                .accruedInterestWithdrawn(result)
                .emitted(lenderAddress, amountWithdrawnExpected);

            const lenderAccountResult = await instance.lenderAccounts(lenderAddress);
            assert.equal(lenderAccountResult.lastBlockAccrued.toString(), currentBlockNumber.toString());
            assert.equal(lenderAccountResult.totalAccruedInterest.toString(), newAccruedInterestExpected.toString());
        });
    });
});