// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const withData = require('leche').withData;
const { t  } = require('../utils/consts');
const { atmToken } = require('../utils/events');
const IATMSettingsEncoder = require('../utils/encoders/IATMSettingsEncoder');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

 // Mock contracts
 const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMToken = artifacts.require("./ATMToken.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('ATMTokenSetCapTest', function (accounts) {
    const atmSettingsEncoder = new IATMSettingsEncoder(web3);
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let atmSettingsInstance;
    let atmInstance;
    let instance;
    let settingsInstance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[2];

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        atmSettingsInstance = await Mock.new();
        await atmSettingsInstance.givenMethodReturnAddress(
            atmSettingsEncoder.encodeSettings(),
            settings.address
        );
        atmInstance = await Mock.new();
        instance = await ATMToken.new();
        await instance.initialize(
                            "ATMToken",
                            "ATMT",
                            18, 
                            10000, 
                            50,
                            settingsInstance.address,
                            atmInstance.address
                        );
        await settingsInstance.givenMethodReturnAddress(
            settingsInterfaceEncoder.encodeATMSettings(),
            atmSettingsInstance.address
        );
    });

    withData({
        _1_set_supply_cap_basic: [true, 70000, daoAgent, undefined, false],
        _2_set_supply_cap_invalid_sender: [false, 100000, daoMember1, 'NOT_PAUSER', true]
    },function(
        isOwner,
        newCap,
        sender,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'setCap', 'Should or should not be able to set cap correctly', mustFail), async function() {
            if(!isOwner) {
                await settingsInstance.givenMethodRevertWithMessage(
                    settingsInterfaceEncoder.encodeRequirePauserRole(),
                    'NOT_PAUSER'
                );
            }
            await atmSettingsInstance.givenMethodReturnBool(
                atmSettingsEncoder.encodeIsATMPaused(),
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