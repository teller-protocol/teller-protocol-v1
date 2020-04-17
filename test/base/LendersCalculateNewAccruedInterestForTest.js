// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./mock/base/LendersMock.sol");

contract('LendersCalculateNewAccruedInterestForTest', function (accounts) {
    let instance;
    let zTokenInstance;
    let lendingPoolInstance;
    
    beforeEach('Setup for each test', async () => {
        zTokenInstance = await Mock.new();
        lendingPoolInstance = await Mock.new();
        instance = await Lenders.new(
            zTokenInstance.address,
            lendingPoolInstance.address,
        );
    });

    withData({
        _1_0Interest_2blocks_5balance: [0, 98, 100, 5, 10],
        _2_14Interest_0blocks_10balance: [14, 100, 100, 10, 14],
        _3_0Interest_0blocks_2000balance: [0, 100, 100, 2000, 0],
        _4_78Interest_200blocks_250balance: [78, 120, 320, 250, 50078],
    }, function(
        currentAccruedInterest,
        previousBlockAccruedInterest,
        currentBlockNumber,
        currentZTokenBalance,
        newAccruedInterestExpected,
    ) {    
        it(t('user', 'calculateNewAccruedInterestFor', 'Should able to calculate the new accrued interest.', false), async function() {
            // Setup

            // Invocation
            const result = await instance.externalCalculateNewAccruedInterestFor(
                currentAccruedInterest,
                previousBlockAccruedInterest,
                currentBlockNumber,
                currentZTokenBalance
            );

            // Assertions
            assert(result);
            assert.equal(result.toString(), newAccruedInterestExpected.toString());
        });
    });
});