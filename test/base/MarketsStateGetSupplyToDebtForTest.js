// JS Libraries
const withData = require('leche').withData;
const { t, createMocks, } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const MarketsState = artifacts.require("./base/MarketsState.sol");

const actions = { Supply: 'Supply', Borrow: 'Borrow', Repay: 'Repay' };

contract('MarketsStateGetSupplyToDebtForTest', function (accounts) {
    const owner = accounts[0];
    let mocks;
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await MarketsState.new();
        instance.addWhitelisted(owner, { from: owner});
        mocks = await createMocks(Mock, 10);
    });

    const newAmount = (amount, type, borrowedIndex, collateralIndex) => ({amount, type, borrowedIndex, collateralIndex});

    withData({
        // (500 borrow - 100 repay + 500 newLoanAmount) / 2000 Supply = 0.45
        _1_scenario: [
            [
                newAmount(1000, actions.Supply, 0, 1),
                newAmount(1000, actions.Supply, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
                newAmount(100, actions.Repay, 0, 1),
            ], 0, 1, 500, 0.45 * 10000
        ],
        // (2000 borrow - 1000 repay + 700 newLoanAmount) / 2000 Supply = 0.85
        _2_scenario: [
            [
                newAmount(1000, actions.Supply, 0, 1),
                newAmount(1000, actions.Supply, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
                newAmount(500, actions.Repay, 0, 1),
                newAmount(500, actions.Repay, 0, 1),
                newAmount(1500, actions.Borrow, 0, 1),
            ], 0, 1, 700, 0.85 * 10000
        ],
        // (2500 borrow - 0 repay + 500 newLoanAmount) / 2500 Supply = 1.25
        _3_scenario: [
            [
                newAmount(1000, actions.Supply, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
                newAmount(1500, actions.Supply, 0, 1),
                newAmount(1500, actions.Borrow, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
            ], 0, 1, 500, 1.2 * 10000
        ],
        // (0 borrow - 0 repay + 1000 newLoanAmount) / 1000 Supply = 1
        _4_scenario: [
            [
                newAmount(1000, actions.Supply, 0, 1),
            ], 0, 1, 1000, 1 * 10000
        ],
        // (0 borrow - 0 repay + 2000 newLoanAmount) / 0 Supply = 0
        _5_scenario: [
            [], 0, 1, 2000, 0 * 10000
        ],
    }, function(previousAmounts, borrowedIndexToTest, collateralIndexToTest, newLoanAmount, expectedResult) {
        it(t('user', 'getSupplyToDebt', 'Should be able to get the supply to debt value.', false), async function() {
            // Setup
            for (const { amount, type, borrowedIndex, collateralIndex } of previousAmounts) {
                const borrowedAssset = mocks[borrowedIndex];
                const collateralAssset = mocks[collateralIndex];
                if(type === actions.Supply) {
                    await instance.increaseSupply(borrowedAssset, collateralAssset, amount, { from: owner });
                }
                if(type === actions.Borrow) {
                    await instance.increaseBorrow(borrowedAssset, collateralAssset, amount, { from: owner });
                }
                if(type === actions.Repay) {
                    await instance.increaseRepayment(borrowedAssset, collateralAssset, amount, { from: owner });
                }
            }
            const borrowedAsssetToTest = mocks[borrowedIndexToTest];
            const collateralAsssetToTest = mocks[collateralIndexToTest];

            // Invocation
            const result = await instance.getSupplyToDebtFor(
                borrowedAsssetToTest,
                collateralAsssetToTest,
                newLoanAmount
            );
            console.log(result.toString());
            // Assertions
            assert.equal(result.toString(), expectedResult.toString());
            
        });
    });
});