// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LenderInfo = artifacts.require("./base/LenderInfo.sol");

contract('LenderInfoConstructorTest', function (accounts) {
    let zdaiInstance;
    let daiPoolInstance;
    
    beforeEach('Setup for each test', async () => {
        zdaiInstance = await Mock.new();
        assert(zdaiInstance);
        assert(zdaiInstance.address);

        daiPoolInstance = await Mock.new();
        assert(daiPoolInstance);
        assert(daiPoolInstance.address);
    });

    withData({
        _1_basic: [true, true, undefined, false],
        _2_notZdaiInstance: [false, true, 'ZDai address is required.', true],
        _3_notDaiPoolInstance: [true, false, 'Dai pool address is required.', true],
        _4_notZdaiInstance_notDaiPoolInstance: [false, false, 'ZDai address is required.', true],
    }, function(
        createZdaiInstance,
        createDaiPoolInstance,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            // Setup
            const zDaiAddress = createZdaiInstance ? zdaiInstance.address : NULL_ADDRESS;
            const daiPoolAddress = createDaiPoolInstance ? daiPoolInstance.address : NULL_ADDRESS;

            try {
                // Invocation
                const result = await LenderInfo.new(
                    zDaiAddress,
                    daiPoolAddress,
                );;
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                assert(result.address);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});