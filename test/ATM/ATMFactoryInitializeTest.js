// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS } = require("../utils/consts");
const { atmSettings } = require("../utils/events");

// Mock contracts
const Mock = artifacts.require("./atm/ATMFactory.sol");

// Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract("ATMFactoryInitializeTest", function (accounts) {

    let atmSettings;
    let settings;

    beforeEach("Setup for each test", async () => {
        atmSettings = await Mock.new();
        settings = await Settings.new();
    });

    withData({
        _1_basic: [0, 0, undefined, false],
        _2_no_settings: [1, 0, "SETTINGS_MUST_BE_A_CONTRACT", true],
        _3_no_atmSettings: [0, 1, "ATM_SETTINGS_MUST_BE_A_CONTRACT", true],
    }, function(settingsInstance, atmSettingsInstance, expectedErrorMessage, mustFail) {
        it(t("admin", "initialize", "Should be able to initialize an ATMFactory", mustFail), async function() {
            // Setup 
            if (settingsInstance == 0) {
                settingsAddress = settings.address;
            } else {
                settingsAddress = NULL_ADDRESS;
            }
            if (atmSettingsInstance == 0) {
                atmSettingsAddress = atmSettings.address;
            } else {
                atmSettingsAddress = NULL_ADDRESS;
            }

            try {
                // Invocation
                const instance = await ATMFactory.new();
                await instance.initialize(settingsAddress, atmSettingsAddress);
                
                // Assertions
                assert(!mustFail, "It should have failed bacause data is invalid.");

                // Validating state changes
                const currentSettings = await instance.getSettings();
                assert.equal(
                    currentSettings,
                    settingsAddress,
                    "Settings was not set correctly"
                );
                const currentATMSettings = await instance.getATMSettings();
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