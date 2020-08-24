// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const withData = require('leche').withData;
const {
    t,
    toBytes32,
    encode
} = require('../utils/consts');
const {
    atmGovernance
} = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('ATMGovernanceRemoveGeneralSettingTest', function (accounts) {
    let instance;

    beforeEach('Setup for each test', async () => {
        const settings = await createTestSettingsInstance(Settings);
        const atmSettings = await Mock.new();
        await atmSettings.givenMethodReturnAddress(
            encode(web3, 'settings()'),
            settings.address
        );

        instance = await ATMGovernance.new();
        await instance.initialize(atmSettings.address);
    });

    // Testing values
    const SETTING_NAME = toBytes32(web3, 'supplyToDebtRatio');
    const NON_EXISTING_NAME = toBytes32(web3, 'NON-EXISTING');
    const SETTING_VALUE = 5044;
    const EMPTY_SETTING_NAME = toBytes32(web3, '');
    const NOT_FOUND = 0;

    withData({
        _1_basic: [0, SETTING_NAME, undefined, false],
        _2_notSigner: [2, SETTING_NAME, 'ONLY_SIGNER', true],
        _3_emptySettingName: [0, EMPTY_SETTING_NAME, 'GENERAL_SETTING_MUST_BE_PROVIDED', true],
        _4_settingNotFound: [0, NON_EXISTING_NAME, 'GENERAL_SETTING_NOT_FOUND', true],
        _5_wrongNameFormat: [0, "nameNotBytes32", 'invalid bytes32 value', true],
    }, function (senderIndex, settingName, expectedErrorMessage, mustFail) {
        it(t('user', 'removeGeneralSetting', 'Should (or not) be able to add a general setting.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];
            const validSigner = accounts[0];

            try {
                // Precondition
                await instance.addGeneralSetting(SETTING_NAME, SETTING_VALUE, {
                    from: validSigner
                });

                // Invocation
                const result = await instance.removeGeneralSetting(settingName, {
                    from: sender
                });


                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating state variables were modified
                const shouldFail = await instance.getGeneralSetting(SETTING_NAME);
                assert.equal(shouldFail, NOT_FOUND);

                // Validating events were emitted
                atmGovernance
                    .generalSettingRemoved(result)
                    .emitted(sender, SETTING_NAME, SETTING_VALUE);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });


});