// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS } = require("../utils/consts");
const { atmFactory } = require("../utils/events");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract("ATMSettingsSetATMSettingsTest", function(accounts) {
    const ADMIN_INDEX = 1;
    const admin = accounts[ADMIN_INDEX];
    let instance;
    let initialATMSettings;
    let atmTokenLogic;
    let atmGovernanceLogic;

    beforeEach("Setup for each test", async () => {
        const settings = await Settings.new();
        await settings.initialize(admin);

        atmTokenLogic = await Mock.new();
        atmGovernanceLogic = await Mock.new();
        const atmSettings = await ATMSettings.new(
            settings.address,
            atmTokenLogic.address,
            atmGovernanceLogic.address
        );

        instance = await ATMFactory.new();
        await instance.initialize(atmSettings.address);
        initialATMSettings = await instance.atmSettings();
    });

    withData({
        _1_basic: [0, admin, undefined, false],
        _2_not_contract: [1, admin, "SETTINGS_MUST_BE_A_CONTRACT", true],
        _3_old_settings: [2, admin, "NEW_ATM_SETTINGS_NOT_PROVIDED", true],
        _4_invalid_sender: [0, accounts[ADMIN_INDEX + 1], "ONLY_PAUSER", true]
    }, function(
            contractIndex,
            sender,
            expectedErrorMessage,
            mustFail
    ) {
        it(t("admin", "setATMSettings", "Should be able to update ATM Settings", mustFail), async function() {
            // Setup
            let newATMSettingsAddress;
            if (contractIndex == 0) {
                let newATMSettings = await ATMSettings.new(
                    settings.address,
                    atmTokenLogic.address,
                    atmGovernanceLogic.address
                );
                newATMSettingsAddress = newATMSettings.address;
            } else if (contractIndex == 1) {
                newATMSettingsAddress = NULL_ADDRESS;
            } else if (contractIndex == 2) {
                newATMSettingsAddress = initialATMSettings;
            }
            
            try {
                // Invocation
                const result = await instance.setATMSettings(newATMSettingsAddress, { from: sender });

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