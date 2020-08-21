// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS } = require("../utils/consts");
const { atmFactory } = require("../utils/events");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract("ATMFactorySetATMSettingsTest", function(accounts) {
    const ADMIN_INDEX = 1;
    let newATMSettings;
    let newATMSettingsAddress;
    let admin;
    let instance;
    let initialATMSettings;

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
        initialATMSettings = await instance.atmSettings();
    });

    withData({
        _1_basic: [0, undefined, false],
        _2_not_contract: [1, "SETTINGS_MUST_BE_A_CONTRACT", true],
        _3_old_settings: [2, "NEW_ATM_SETTINGS_NOT_PROVIDED", true]
    }, function(
            contractIndex,
            expectedErrorMessage,
            mustFail
    ) {
        it(t("admin", "setATMSettings", "Should be able to update ATM Settings", mustFail), async function() {
            // Setup
            if (contractIndex == 0) {
                newATMSettings = await Mock.new();
                newATMSettingsAddress = newATMSettings.address;
            } else if (contractIndex == 1) {
                newATMSettingsAddress = NULL_ADDRESS;
            } else if (contractIndex == 2) {
                newATMSettingsAddress = initialATMSettings;
            }
            
            try {
                // Invocation
                const result = await instance.setATMSettings(newATMSettingsAddress, { from:admin });

                // Assertions
                assert(!mustFail, "It should have failed because data is invalid.");
                assert(result);

                // Validating state changes
                const currentATMSettings = await instance.atmSettings();
                assert.equal(
                    currentATMSettings,
                    newATMSettingsAddress,
                    "ATM Settings were not updated"
                );
                
                // Validating events were emitted
                atmFactory
                    .atmSettingsUpdated(result)
                    .emitted(admin, initialATMSettings, newATMSettingsAddress);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

});