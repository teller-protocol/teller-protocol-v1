// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS } = require("../utils/consts");
const { atmFactory } = require("../utils/events");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract("ATMFactorySetSettingsTest", function (accounts) {
    const ADMIN_INDEX = 1;
    let admin;
    let instance;
    let initialSettingsAddress;

    beforeEach("Setup for each test", async () => {
        admin = accounts[ADMIN_INDEX];
        const settings = await Settings.new();
        await settings.initialize(admin);
        instance = await ATMFactory.new();
        const atmSettings = await Mock.new();
        const atmTokenTemplate = await Mock.new();
        const atmGovernanceTemplate = await Mock.new();
        await instance.initialize(
            settings.address,
            atmSettings.address,
            atmTokenTemplate.address,
            atmGovernanceTemplate.address,
        );
        initialSettingsAddress = await instance.settings();
    });

    withData({
        _1_basic: [0, undefined, false],
        _2_not_contract: [1, "SETTINGS_MUST_BE_A_CONTRACT", true],
        _3_old_settings: [2, "NEW_SETTINGS_MUST_BE_PROVIDED", true]
    }, function(
        contractIndex,
        expectedErrorMessage,
        mustFail
    ) {
        it(t("admin", "setSettings", "Should be able to update Settings", mustFail), async function() {
            // Setup
            let newSettings;
            if (contractIndex == 0) {
                newSettings = await Mock.new();
                newSettingsAddress = newSettings.address;
            } else if (contractIndex == 1) {
                newSettingsAddress = NULL_ADDRESS;
            } else if (contractIndex == 2) {
                newSettingsAddress = initialSettingsAddress;
            }

            try {
                // Invocation
                const result = await instance.setSettings(newSettingsAddress, { from:admin });
                
                // Assertions
                assert(!mustFail, "It should have failed because data is invalid.");
                assert(result);

                // Validating state changes
                const currentSettings = await instance.settings();
                assert.equal(
                    currentSettings,
                    newSettingsAddress,
                    "Settings were not updated"
                );

                // Validating events were emitted
                atmFactory
                    .settingsUpdated(result)
                    .emitted(admin, initialSettingsAddress, newSettingsAddress);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});