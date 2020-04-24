// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Smart contracts
const NumbersListMock = artifacts.require("./mock/util/NumbersListMock.sol");

contract('ValuesListTest', function (accounts) {
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await NumbersListMock.new();
    });

    withData({
        _1_basic: [[1,2,3]]
    }, function(values) {
        it(t('user', 'addValue', 'Should be able to add a new value.', false), async function() {
            // Setup

            // Invocation
            for (const value of values) {
                await instance.addValue(value);
            }
            
            // Assertions
            const result = await instance.totalValues();
            assert.equal(result.toString(), values.length.toString());
        });
    });

    withData({
        _1_basic: [[1,2,3], 2],
        _2_roundDown: [[4,3,1], 2]
    }, function(values, expectedAverage) {
        it(t('user', 'getAverage', 'Should be able to get the average.', false), async function() {
            // Setup
            for (const value of values) {
                await instance.addValue(value);
            }

            // Invocation
            const result = await instance.getAverage();
            
            // Assertions
            assert.equal(result.toString(), expectedAverage.toString());
        });
    });

    withData({
        _1_notFinalized: [[1,2,3], 4, false],
        _2_finalized: [[4,3,1], 2, true]
    }, function(values, requiredItems, expectedFinalized) {
        it(t('user', 'isFinalized', 'Should be able to test if it is finalized.', false), async function() {
            // Setup
            for (const value of values) {
                await instance.addValue(value);
            }

            // Invocation
            const result = await instance.isFinalized(requiredItems);
            
            // Assertions
            assert.equal(result.toString(), expectedFinalized.toString());
        });
    });

    withData({
        _1_empty: [[], 0, 0, 0],
        _2_1Item: [[2], 2, 2, 2],
        _3_3Items: [[1,2,3], 1, 3, 6],
        _4_5Items: [[4,3,1], 1, 4, 8],
        _5_10Items: [[21, 14, 18, 4, 13, 15, 2, 35, 27, 8], 2, 35, 157]
    }, function(values, expectedMin, expectedMax, expectedSum) {
        it(t('user', 'min/max/sum/length', 'Should be able to get min/max/sum/length.', false), async function() {
            // Setup
            for (const value of values) {
                await instance.addValue(value);
            }

            // Invocation
            const { min, max, sum, length } = await instance.values();
            
            // Assertions
            assert.equal(min.toString(), expectedMin.toString());
            assert.equal(max.toString(), expectedMax.toString());
            assert.equal(sum.toString(), expectedSum.toString());
            assert.equal(length.toString(), values.length.toString());
        });
    });

    withData({
        _1_empty: [[], 0, false],
        _2_10min_10max_10avg_1tol: [[10], 1, true],
        _3_10min_30max_20avg_10tol: [[10, 20, 30], 10, false],
    }, function(values, tolerance, expectedResult) {
        it(t('user', 'isWithinTolerance', 'Should be able to get min/max/sum.', false), async function() {
            // Setup
            for (const value of values) {
                await instance.addValue(value);
            }

            // Invocation
            const result = await instance.isWithinTolerance(tolerance);
            
            // Assertions
            assert.equal(result.toString(), expectedResult.toString());
        });
    });
});