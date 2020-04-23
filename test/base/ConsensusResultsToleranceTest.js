// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Smart contracts
const ConsensusMock = artifacts.require("./mock/base/ConsensusMock.sol");

contract('ConsensusResultsToleranceTest', function () {

    withData({
        // average + tolerance = 552 (max is 560)
        _1_max_too_high: [230, 560, 538, 540, false],
        // average - tolerance = 528 (min is 520)
        _2_min_too_low: [230, 550, 520, 540, false],
        _3_all_within_range: [320, 35970, 33780, 34860, true],
        // average + tolerance = 35975 (max is 35976)
        _4_max_too_high_close: [320, 35976, 34000, 34860, false],
        // average - tolerance = 14075 (min is 14074)
        _5_min_too_low_close: [123, 14350, 14074, 14250, false],
        // all the same with 0 tolerance
        _6_all_within_range_0_tolerance: [0, 12345, 12345, 12345, true],
    }, function(
        maximumTolerance,
        maximum,
        minimum,
        average,
        expectedResult,
    ) {    
        it(t('user', 'new', 'Should return false if numbers are out of range', false), async function() {
            const requiredSubmissions = 5

            // Invocation
            const instance = await ConsensusMock.new(
                requiredSubmissions,
                maximumTolerance,
            );

            let result = await instance.externalResultsWithinTolerance(
                maximum,
                minimum,
                average
            )

            assert.equal(result, expectedResult, 'Result should have been ' + expectedResult);
        });
    });
});