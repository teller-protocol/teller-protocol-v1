// JS Libraries
const withData = require('leche').withData;
const { t  } = require('../utils/consts');
const { tlrToken } = require('../utils/events');
const ATMSettingsEncoder = require('../utils/encoders/ATMSettingsEncoder');
const SettingsEncoder = require('../utils/encoders/SettingsEncoder');

 // Mock contracts
 const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const TLRToken = artifacts.require("./TLRToken.sol");

contract('TLRTokenSetCapTest', function (accounts) {
    const atmSettingsEncoder = new ATMSettingsEncoder(web3);
    const settingsEncoder = new SettingsEncoder(web3);
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
            settingsInstance.address
        );
        atmInstance = await Mock.new();
        instance = await TLRToken.new();
        await instance.initialize(
                            "Teller Token",
                            "TLR",
                            18, 
                            10000, 
                            50,
                            settingsInstance.address,
                            atmInstance.address
                        );
        await settingsInstance.givenMethodReturnAddress(
            settingsEncoder.encodeATMSettings(),
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
                    settingsEncoder.encodeRequirePauserRole(),
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
                tlrToken
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
