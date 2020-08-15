// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS  } = require('../utils/consts');
const { atmToken } = require('../utils/events');
const SettingsInterfaceEncoder = require('../utils/encoders/settingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMToken = artifacts.require("./ATMToken.sol");

contract('ATMTokenSetCapTest', function (accounts) {
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let instance;
    let settingsInstance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[2];

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        instance = await ATMToken.new(
                                    "ATMToken",
                                    "ATMT",
                                    18,
                                    100000,
                                    50,
                                    settingsInstance.address
                            );
    });

    withData({
        _1_set_supply_cap_basic: [70000, daoAgent, undefined, false],
        _2_set_supply_cap_invalid_sender: [100000, daoMember1, 'CALLER_IS_NOT_OWNER', true]
    },function(
        newCap,
        sender,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'setCap', 'Should or should not be able to set cap correctly', mustFail), async function() {
            await settingsInstance.givenMethodReturnBool(
                settingsInterfaceEncoder.encodeIsPaused(),
                false
            );
            try {
                // Invocation
                const result = await instance.setCap(newCap, { from: sender });
                const cap = await instance.cap();
                // Assertions
                assert(!mustFail, 'It should have failed because the sender is invalid');
                assert.equal(
                    cap,
                    newCap,
                    'New supply cap not set!'
                );
                atmToken
                    .newCap(result)
                    .emitted(newCap);
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(
                    error.reason,
                    expectedErrorMessage
                    );
            }

        });
    });

})