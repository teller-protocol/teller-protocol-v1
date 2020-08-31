// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const withData = require("leche").withData;
const { t } = require("../utils/consts");
const { atmFactory } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract("ATMFactoryCreateATMTest", function(accounts) {
    let instance;

    beforeEach("Setup for each test", async () => {
        const atmTokenLogic = await ATMToken.new();
        const atmGovernanceLogic = await ATMGovernance.new();

        const settings = await createTestSettingsInstance(Settings);
        const atmSettings = await ATMSettings.new(settings.address, atmTokenLogic.address, atmGovernanceLogic.address);

        instance = await ATMFactory.new();
        await instance.initialize(settings.address, { from: admin });
    });

    withData({
        _1_basic: [ ADMIN_INDEX, "TokenName", "TKN", 18, 1000, 20000, undefined, false ],
        _2_notAdmin: [ 0, "TokenName", "TKN", 18, 1000, 20000, true, "NOT_PAUSER" ],

    }, function(senderIndex, name, symbol, decimals, cap, maxVesting, mustFail, expectedErrorMessage) {
        it(t("admin", "createATM", "Should be able to create an ATM.", mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            try {
                // Invocation 
                const result = await instance.createATM(
                    name,
                    symbol,
                    decimals,
                    cap,
                    maxVesting,
                    {from : sender }
                );
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating state changes
                const atmsList = await instance.atmsList();
                const newATM = atmsList[atmsList.length - 1];
                
                // Validating ATM instance creation
                const isATM = await instance.isATM(newATM);
                assert(isATM);

                // Validating events were emitted
                const atmTokenExpected = await instance.getATMToken(newATM);
                atmFactory
                    .atmCreated(result)
                    .emitted(sender, newATM, atmTokenExpected);
                
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
