// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Consensus = artifacts.require("./base/ConsensusModifiersMock.sol");

contract('ConsensusModifiersTest', function (accounts) {

    withData({
        _1_not_lenders: [accounts[1], accounts[3], 'Address has no permissions.', true],
        _2_lenders: [accounts[1], accounts[1], undefined, false]
    }, function(
        callerAddress,
        msgSender,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) be able to call the function', mustFail), async function() {
            try {
                // Setup
                const settingsInstance = await Mock.new();
                const instance = await Consensus.new();
                await instance.initialize(callerAddress, settingsInstance.address)

                const result = await instance.externalIsCaller({ from:  msgSender })

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