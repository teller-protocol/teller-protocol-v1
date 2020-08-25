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
        mocks = await createMocks(Mock, 10);
    });

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_basic: [1, undefined, false],
        _2_no_atm_settings: [99, "ATM_SETTINGS_MUST_BE_A_CONTRACT", true],
    }, function(
        atmSettingsIndex,
        expectedErrorMessage,
        mustFail
    ) {
        it(t("admin", "initialize", "Should be able (or not) to initialize an ATMFactory", mustFail), async function() {
            // Setup 
            const sender = accounts[0];
            const instance = await ATMFactory.new();
            const atmSettingsAddress = getInstance(mocks, atmSettingsIndex, 2);

            try {
                // Invocation
                await instance.initialize(
                    atmSettingsAddress,
                    { from: sender }
                );
                
                // Assertions
                assert(!mustFail, "It should have failed bacause data is invalid.");

                // Validating state changes
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