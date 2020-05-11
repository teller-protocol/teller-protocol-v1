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
            assert.equal(result.toString(), values.count.toString());
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
        it(t('user', 'min/max/sum/count', 'Should be able to get min/max/sum/count.', false), async function() {
            // Setup
            for (const value of values) {
                await instance.addValue(value);
            }

            // Invocation
            const { min, max, sum, count } = await instance.values();
            
            // Assertions
            assert.equal(min.toString(), expectedMin.toString());
            assert.equal(max.toString(), expectedMax.toString());
            assert.equal(sum.toString(), expectedSum.toString());
            assert.equal(count.toString(), values.count.toString());
        });
    });

    withData({
        _1_empty: [[], 0, false],
        _2_10min_10max_10avg_1tol: [[10], 1, true],
        _3_10min_30max_20avg_10tol: [[10, 20, 30], 10, false],
        // average 542, tolerance 12
        _4_max_too_high: [[560,535,538,535], 230, false],
        // average 540, tolerance 12
        _5_min_too_low: [[550,520,550], 230, false],
        // average 34860, tolerance 1115
        _6_all_within_range: [[35970, 33780, 34830], 320, true],
        // average 34860, tolerance = 1115, (max is 35976)
        _7_max_too_high_close: [[35976, 34732, 34732, 34000], 320, false],
        // average 14250, tolerance 175, (min is 14074)
        _8_min_too_low_close: [[14350, 14074, 14326], 123, false],
        // all the same with 0 tolerance
        _9_all_within_range_0_tolerance: [[12345, 12345, 12345], 0, true],
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