// JS Libraries
const withData = require('leche').withData;
const { t, createMocks, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");

contract('EscrowFactoryInitializeTest', async function (accounts) {
    let mocks;

    beforeEach(async () => {
        mocks = await createMocks(Mock, 10);
    })

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_valid: [1, undefined, false],
        _2_invalid_empty_settings_address: [-1, 'SETTINGS_MUST_BE_A_CONTRACT', true],
        _3_invalid_not_contract_settings_address: [99, 'SETTINGS_MUST_BE_A_CONTRACT', true]
    }, function(
        settingsIndex,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('owner', 'initialize', 'Should be able to initialize an instance.', mustFail), async function() {
            // Setup
            const settingsAddress = getInstance(mocks, settingsIndex, 2);
            const instance = await EscrowFactory.new();

            try {
                // Invocation
                const result = await instance.initialize(settingsAddress);

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
