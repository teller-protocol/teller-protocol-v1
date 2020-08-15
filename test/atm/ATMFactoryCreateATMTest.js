// JS Libraries
const withData = require("leche").withData;
const { t, toBytes32 } = require("../utils/consts");

// Smart contracts
const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract("ATMFactoryCreateATMTest", function(accounts) {

    let instance;
    beforeEach("Setup for each test", async () => {
        const settings = await Settings.new();
        instance = await ATMFactory.new();
        await instance.initialize(settings.address);
    });

    withData({
        _1_basic: [ 1, 0, "TokenName", "TKN", 18, 1000, 20000, true, "SENDER_ISNT_ALLOWED" ],

    }, function(senderIndex, adminIndex, name, symbol, decimals, cap, maxVesting, mustFail, expectedErrorMessage) {
        it(t("admin", "createATM", "Should be able to create an ATM.", mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const admin = accounts[adminIndex];
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
                // PENDING 

                
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
