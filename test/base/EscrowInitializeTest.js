// JS Libraries
const withData = require('leche').withData;
const { t, createMocks, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Escrow = artifacts.require("./base/Escrow.sol");

contract('EscrowInitializeTest', async function (accounts) {
    let mocks;

    beforeEach(async () => {
        mocks = await createMocks(Mock, 10);
    })

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_loans_not_contract: [99, 99, 10, 'LOANS_MUST_BE_A_CONTRACT', true],
        _2_sender_not_contract: [1, 99, 11, 'SENDER_MUST_BE_A_CONTRACT', true],
    }, function(loansIndex, senderIndex, loanID, expectedErrorMessage, mustFail) {
        it(t('owner', 'initialize', 'Should be able to initialize an instance.', mustFail), async function() {
            // Setup
            const loansAddress = getInstance(mocks, loansIndex, 2);
            const sender = getInstance(mocks, senderIndex, 3);
            const instance = await Escrow.new();

            try {
                // Invocation
                const result = await instance.initialize(loansAddress, loanID, { from: sender });

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
