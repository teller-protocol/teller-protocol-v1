// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");

contract('ATMSettingsConstructorTest', function (accounts) {
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let settings;
    let mocks;

    beforeEach('Setup for each test', async () => {
        settings = await Mock.new();
        await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeHasPauserRole(), true);
        await settings.givenMethodReturnBool(settingsInterfaceEncoder.encodeIsPaused(), false);

        mocks = await createMocks(Mock, 10);
    });

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_basic: [true, 2, 3, undefined, false],
        _2_empty_settings: [false, 2, 3, 'SETTINGS_MUST_BE_A_CONTRACT', true],
        _3_no_atmTokenLogic: [true, 99, 3, "TLR_TOKEN_MUST_BE_A_CONTRACT", true],
        _4_no_atmTokenLogic: [true, 2, 99, "ATM_GOV_MUST_BE_A_CONTRACT", true],
    }, function(
        setSettings,
        atmTokenIndex,
        atmGovernanceIndex,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'new', 'Should be able to create a new instance or not.', mustFail), async function() {
            // Setup
            const settingsAddress = setSettings ? settings.address : accounts[2];
            const atmTokenAddress = getInstance(mocks, atmTokenIndex, 3);
            const atmGovernanceAddress = getInstance(mocks, atmGovernanceIndex, 4);

            try {
                // Invocation
                const result = await ATMSettings.new(settingsAddress, atmTokenAddress, atmGovernanceAddress);
                
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