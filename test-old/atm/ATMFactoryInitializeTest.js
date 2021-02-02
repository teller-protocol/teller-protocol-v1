// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS } = require("../utils/consts");

// Mock contracts

// Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract("ATMFactoryInitializeTest", function (accounts) {

    let settings;

    beforeEach("Setup for each test", async () => {
        settings = await Settings.new();
    });

    withData({
        _1_basic: [0, undefined, false],
    }, function(settingsInstance, expectedErrorMessage, mustFail) {
        it(t("admin", "initialize", "Should be able to initialize an ATMFactory", mustFail), async function() {
            // Setup
            let settingsAddress
            if (settingsInstance == 0) {
                settingsAddress = settings.address;
            } else {
                settingsAddress = NULL_ADDRESS;
            }
            const instance = await ATMFactory.new();

            try {
                // Invocation
                await instance.initialize(settingsAddress);
                
                // Assertions
                assert(!mustFail, "It should have failed bacause data is invalid.");

                // Validating state changes
                const currentSettings = await instance.settings();
                assert.equal(
                    currentSettings,
                    settingsAddress,
                    "Settings was not set correctly"
                );
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        })
    })
});