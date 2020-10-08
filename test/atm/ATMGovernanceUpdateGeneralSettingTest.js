// JS Libraries
const withData = require('leche').withData;
const {
    t,
    toBytes32,
} = require('../utils/consts');
const {
    atmGovernance
} = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");

contract('ATMGovernanceUpdateGeneralSettingTest', function (accounts) {
    let instance;
    let settingsInstance;

    // Testing values
    const SETTING_NAME = toBytes32(web3, 'supplyToDebtRatio');
    const SETTING_OLD_VALUE = 4400;
    const SETTING_NEW_VALUE = 5044;
    const EMPTY_SETTING_NAME = toBytes32(web3, '');
    const ANY_VALUE = 1;

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        instance = await ATMGovernance.new();
        const validSender = accounts[0];
        await instance.initialize(settingsInstance.address, validSender, ANY_VALUE);
        // Adding the general setting we will update later
        await instance.addGeneralSetting(SETTING_NAME, SETTING_OLD_VALUE);
    });


    withData({
        _1_basic: [0, SETTING_NAME, SETTING_NEW_VALUE, undefined, false],
        _2_notSigner: [2, SETTING_NAME, SETTING_NEW_VALUE, 'SignerRole: caller does not have the Signer role', true],
        _3_emptySettingName: [0, EMPTY_SETTING_NAME, SETTING_NEW_VALUE, 'GENERAL_SETTING_MUST_BE_PROVIDED', true],
        _4_sameOldValue: [0, SETTING_NAME, SETTING_OLD_VALUE, 'GENERAL_SETTING_EQUAL_PREVIOUS', true],
        _5_invalidValueZero: [0, SETTING_NAME, 0, 'GENERAL_SETTING_MUST_BE_POSITIVE', true],
        _6_wrongNameFormat: [0, "nameNotBytes32", SETTING_NEW_VALUE, 'invalid bytes32 value', true],
    }, function (senderIndex, settingName, settingValue, expectedErrorMessage, mustFail) {
        it(t('user', 'updateGeneralSetting', 'Should (or not) be able to update a general setting.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];

            try {
                // Invocation
                const result = await instance.updateGeneralSetting(settingName, settingValue, {
                    from: sender
                });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating state variables were modified
                const aSettingValue = await instance.getGeneralSetting(SETTING_NAME);
                assert.equal(aSettingValue, SETTING_NEW_VALUE);

                // Validating events were emitted
                atmGovernance
                    .generalSettingUpdated(result)
                    .emitted(sender, SETTING_NAME, SETTING_OLD_VALUE, SETTING_NEW_VALUE);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

});