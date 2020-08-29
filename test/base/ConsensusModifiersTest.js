// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Consensus = artifacts.require("./base/ConsensusModifiersMock.sol");

contract('ConsensusModifiersTest', function (accounts) {

    withData({
        _1_caller_empty: [-1, 'SENDER_HASNT_PERMISSIONS', true],
        _2_caller_account: [99, 'SENDER_HASNT_PERMISSIONS', true],
        _3_valid: [2, undefined, false]
    }, function(
        callerIndex,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'isCaller', 'Should (or not) be able to call the function', mustFail), async function() {
            // Setup
            const settingsInstance = await Mock.new();
            const callerInstance = await Mock.new();
            const instance = await Consensus.new();
            await instance.initialize(callerInstance.address, settingsInstance.address);
            const callerAddress = callerIndex === -1 ? NULL_ADDRESS : callerIndex === 99 ? accounts[2] : callerInstance.address;
            try {
                // Invocation
                const result = await instance.externalIsCaller(callerAddress);

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});