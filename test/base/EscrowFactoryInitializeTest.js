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
        _1_valid: [1, 2, undefined, false],
        _2_invalid_empty_settings_address: [-1, 3, 'SETTINGS_MUST_BE_A_CONTRACT', true],
        _3_invalid_not_contract_settings_address: [99, 3, 'SETTINGS_MUST_BE_A_CONTRACT', true],
        _2_invalid_empty_escrow_address: [4, -1, 'ESCROW_LIB_MUST_BE_A_CONTRACT', true],
        _3_invalid_not_contract_escrow_address: [2, 99, 'ESCROW_LIB_MUST_BE_A_CONTRACT', true],
    }, function(settingsIndex, escrowIndex, expectedErrorMessage, mustFail) {
        it(t('owner', 'initialize', 'Should be able to initialize an instance.', mustFail), async function() {
            // Setup
            const settingsAddress = getInstance(mocks, settingsIndex, 2);
            const escrowAddress = getInstance(mocks, escrowIndex, 3);
            const instance = await EscrowFactory.new();

            try {
                // Invocation
                const result = await instance.initialize(settingsAddress, escrowAddress);

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
