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
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");
const TLRToken = artifacts.require("./atm/TLRToken.sol");
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");

contract("ATMFactoryCreateATMTest", function(accounts) {
    let instance;

    beforeEach("Setup for each test", async () => {
        const tlrTokenLogic = await TLRToken.new();
        const atmGovernanceLogic = await ATMGovernance.new();

        const settings = await createTestSettingsInstance(Settings);
        const atmSettings = await ATMSettings.new(settings.address, tlrTokenLogic.address, atmGovernanceLogic.address);

        instance = await ATMFactory.new();
        await instance.initialize(atmSettings.address);
    });

    withData({
        _1_basic: [ 0, "TokenName", "TKN", 18, 1000, 20000, false, undefined ],
        _2_invalid_sender: [ 1, "TokenName", "TKN", 18, 1000, 20000, true, "ONLY_PAUSER" ],
    }, function(
        senderIndex,
        name,
        symbol,
        decimals,
        cap,
        maxVesting,
        mustFail,
        expectedErrorMessage
    ) {
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
                const atmsList = await instance.getATMs();
                const newATM = atmsList[atmsList.length - 1];
                
                // Validating ATM instance creation
                const isATM = await instance.isATM(newATM);
                assert(isATM);

                // Validating events were emitted
                const atmTokenExpected = await instance.getTLRToken(newATM);
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
