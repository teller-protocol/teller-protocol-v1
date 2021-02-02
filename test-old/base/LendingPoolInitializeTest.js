// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LendingPool = artifacts.require("./base/LendingPool.sol");

contract('LendingPoolInitializeTest', function (accounts) {
    let mocks;

    beforeEach('Setup for each test', async () => {
        mocks = await createMocks(Mock, 20);
    });

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_notTdai: [-1, 3, 4, 6, 'TTOKEN_ADDRESS_IS_REQUIRED', true],
        _2_basic: [2, 3, 4, 6, undefined, false],
        _3_notDai: [2, -1, 4, 6, 'TOKEN_ADDRESS_IS_REQUIRED', true],
        _4_notTdai: [-1, 3, 4, 6, 'TTOKEN_ADDRESS_IS_REQUIRED', true],
        _5_notDai_notLenderInfo: [2, -1, -1, 6, 'TOKEN_ADDRESS_IS_REQUIRED', true],
        _6_notSettings: [2, 3, 4, -1, 'SETTINGS_MUST_BE_PROVIDED', true],
    }, function(
        tdaiIndex,
        daiIndex,
        lenderInfoIndex,
        settingsIndex,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'initialize', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            // Setup
            const lendingPoolInstance = await LendingPool.new();
            const tTokenAddress = getInstance(mocks, tdaiIndex, 2);
            const daiAddress = getInstance(mocks, daiIndex, 3);
            const settingsAddress = getInstance(mocks, settingsIndex, 7);

            try {
                // Invocation
                const result = await lendingPoolInstance.initialize(
                    tTokenAddress,
                    daiAddress,
                    settingsAddress
                );
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
