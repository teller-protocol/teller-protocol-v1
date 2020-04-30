// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { lenders } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./mock/base/LendersMock.sol");

contract('LendersWithdrawInterestTest', function (accounts) {
    let instance;
    let zTokenInstance;
    let lendingPoolInstance;
    let interestConsensusInstance;
    
    beforeEach('Setup for each test', async () => {
        zTokenInstance = await Mock.new();
        lendingPoolInstance = await Mock.new();
        interestConsensusInstance = await Mock.new();
        instance = await Lenders.new(
            zTokenInstance.address,
            lendingPoolInstance.address,
            interestConsensusInstance.address
        );
    });

    withData({
        _1_0Available_10Requested: [accounts[0], 10, 0, 100, 4, 0, 0],
        _2_50Available_10Requested: [accounts[1], 10, 50, 100, 3, 10, 40],
        _3_50Available_100Requested: [accounts[2], 100, 50, 100, 20, 50, 0],
        _5_50Available_0Requested: [accounts[0], 0, 50, 100, 4, 0, 50],
    }, function(
        lenderAddress,
        amountToWithdraw,
        totalNotWithdrawn,
        totalAccruedInterest,
        timeLastAccrued,
        amountWithdrawnExpected,
        newTotalNotWithdrawn,
    ) {    
        it(t('user', 'withdrawInterest', 'Should able to withdraw interest.', false), async function() {
            // Setup
            await instance.mockLenderInfo(
                lenderAddress,
                timeLastAccrued.toString(),
                totalNotWithdrawn.toString(),
                totalAccruedInterest.toString()
            );

            // Invocation
            const result = await instance.withdrawInterest(lenderAddress, amountToWithdraw);

            // Assertions
            assert(result);
            if (amountWithdrawnExpected != 0) {
                lenders
                    .accruedInterestWithdrawn(result)
                    .emitted(lenderAddress, amountWithdrawnExpected);
            }

            const lenderAccruedInterest = await instance.accruedInterest(lenderAddress);
            assert.equal(lenderAccruedInterest.totalNotWithdrawn.toString(), newTotalNotWithdrawn.toString());
            assert.equal(lenderAccruedInterest.timeLastAccrued.toString(), timeLastAccrued.toString());
            assert.equal(lenderAccruedInterest.totalAccruedInterest.toString(), totalAccruedInterest.toString());
        });
    });
});