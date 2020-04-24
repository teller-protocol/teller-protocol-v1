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
});