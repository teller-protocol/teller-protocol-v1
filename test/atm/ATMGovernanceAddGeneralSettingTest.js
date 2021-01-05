// JS Libraries
const withData = require('leche').withData;
const {
    t,
    toBytes32
} = require('../utils/consts');
const {
    atmGovernance
} = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");

contract('ATMGovernanceAddGeneralSettingTest', function (accounts) {
    const owner = accounts[0];
    let instance;
    let settingsInstance;
    const ANY_VALUE = 1;

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        instance = await ATMGovernance.new();
        await instance.initialize(settingsInstance.address, owner, ANY_VALUE);
    });

    // Testing values
    const SETTING_NAME = toBytes32(web3, 'supplyToDebtRatio');
    const SETTING_VALUE = 5044;
    const EMPTY_SETTING_NAME = toBytes32(web3, '');
    const EMPTY_SETTING_VALUE = 0;

    withData({
        _1_basic: [0, SETTING_NAME, SETTING_VALUE, undefined, false],
        _2_notSigner: [2, SETTING_NAME, SETTING_VALUE, 'SignerRole: caller does not have the Signer role', true],
        _3_emptySettingName: [0, EMPTY_SETTING_NAME, SETTING_VALUE, 'GENERAL_SETTING_MUST_BE_PROVIDED', true],
        _4_emptySettingValue: [0, SETTING_NAME, EMPTY_SETTING_VALUE, 'GENERAL_SETTING_MUST_BE_POSITIVE', true],
        _5_wrongNameFormat: [0, "nameNotBytes32", SETTING_VALUE, 'invalid bytes32 value', true],
    }, function (senderIndex, settingName, settingValue, expectedErrorMessage, mustFail) {
        it(t('user', 'addGeneralSetting#1', 'Should (or not) be able to add a general setting.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];

            try {

                // Invocation
                const result = await instance.addGeneralSetting(settingName, settingValue, {
                    from: sender
                });


                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating state variables were modified
                const aSettingValue = await instance.getGeneralSetting(SETTING_NAME);
                assert.equal(aSettingValue, SETTING_VALUE);

                // Validating events were emitted
                atmGovernance
                    .generalSettingAdded(result)
                    .emitted(sender, SETTING_NAME, SETTING_VALUE);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_duplicateAdd: [0, SETTING_NAME, SETTING_VALUE, 'GENERAL_SETTING_ALREADY_EXISTS', true],
    }, function (senderIndex, settingName, settingValue, expectedErrorMessage, mustFail) {
        it(t('user', 'addGeneralSetting#2', 'Should not be able to add a general setting twice.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];

            try {
                // Invocation
                const result1 = await instance.addGeneralSetting(settingName, settingValue, {
                    from: sender
                });
                // Trying to add the same settingName a second time
                const result2 = await instance.addGeneralSetting(settingName, settingValue, {
                    from: sender
                });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });



});