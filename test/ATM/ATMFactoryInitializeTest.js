// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS, createMocks } = require("../utils/consts");

// Mock contracts
const Mock = artifacts.require("./atm/ATMFactory.sol");

// Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");

contract("ATMFactoryInitializeTest", function (accounts) {
    let mocks;

    beforeEach("Setup for each test", async () => {
        mocks = await createMocks(Mock, 20);
    });

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_basic: [1, 2, 3, 4, undefined, false],
        _2_no_settings: [99, 2, 3, 4, "SETTINGS_MUST_BE_A_CONTRACT", true],
        _3_no_atmSettings: [1, 99, 3, 4, "ATM_SETTINGS_MUST_BE_A_CONTRACT", true],
        _4_no_atmTokenTemplate: [1, 2, 99, 4, "ATM_TOKEN_MUST_BE_A_CONTRACT", true],
        _5_no_atmTokenTemplate: [1, 2, 3, 99, "ATM_GOV_MUST_BE_A_CONTRACT", true],
    }, function(
        settingsIndex,
        atmSettingsIndex,
        atmTokenTemplateIndex,
        atmGovernanceTemplateIndex,
        expectedErrorMessage,
        mustFail
    ) {
        it(t("admin", "initialize", "Should be able (or not) to initialize an ATMFactory", mustFail), async function() {
            // Setup 
            const sender = accounts[0];
            const instance = await ATMFactory.new();
            const settingsAddress = getInstance(mocks, settingsIndex, 2);
            const atmSettingsAddress = getInstance(mocks, atmSettingsIndex, 3);
            const atmTokenTemplateAddress = getInstance(mocks, atmTokenTemplateIndex, 4);
            const atmGovernanceTemplateAddress = getInstance(mocks, atmGovernanceTemplateIndex, 5);

            try {
                // Invocation
                await instance.initialize(
                    settingsAddress,
                    atmSettingsAddress,
                    atmTokenTemplateAddress,
                    atmGovernanceTemplateAddress,
                    { from: sender }
                );
                
                // Assertions
                assert(!mustFail, "It should have failed bacause data is invalid.");

                // Validating state changes
                const currentSettings = await instance.settings();
                assert.equal(
                    currentSettings,
                    settingsAddress,
                    "Settings was not set correctly"
                );
                const currentATMSettings = await instance.atmSettings();
                assert.equal(
                    currentATMSettings,
                    atmSettingsAddress,
                    "ATMSettings was not set correctly"
                );
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        })
    })
});