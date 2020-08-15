// JS Libraries
const withData = require("leche").withData;
const { t } = require("../utils/consts");
const { atmFactory } = require('../utils/events');

// Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");

contract("ATMFactoryCreateATMTest", function(accounts) {
    const ADMIN_INDEX = 1; 

    let instance;
    let admin;

    beforeEach("Setup for each test", async () => {
        admin = accounts[ADMIN_INDEX];
        const settings = await Settings.new();
        await settings.initialize(admin);
        instance = await ATMFactory.new();
        await instance.initialize(settings.address);
    });

    withData({
        _1_basic: [ ADMIN_INDEX, "TokenName", "TKN", 18, 1000, 20000, undefined, false ],
        _2_notAdmin: [ 0, "TokenName", "TKN", 18, 1000, 20000, true, "SENDER_ISNT_ALLOWED" ],

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
                    maxVesting
                    , {from : sender }
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

                // Validating ATM Token instance creation
                const atmInstance = await ATMGovernance.at(newATM);
                const atmToken = await atmInstance.getATMToken();

                // Validating events were emitted
                atmFactory
                    .atmCreated(result)
                    .emitted(sender, newATM, atmToken);
                
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
