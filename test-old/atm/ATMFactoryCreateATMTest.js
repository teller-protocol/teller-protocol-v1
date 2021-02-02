// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const withData = require("leche").withData;
const { t } = require("../utils/consts");
const { atmFactory } = require('../utils/events');
const LogicVersionsRegistryEncoder = require('../utils/encoders/LogicVersionsRegistryEncoder');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");

contract("ATMFactoryCreateATMTest", function(accounts) {
    const logicVersionsRegistryEncoder = new LogicVersionsRegistryEncoder(web3);
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    const ADMIN_INDEX = 1; 

    let settingsInstance;
    let instance;
    let versionsRegistry;
    let constsInstance;
    let admin;

    beforeEach("Setup for each test", async () => {
        admin = accounts[ADMIN_INDEX];
        versionsRegistry = await Mock.new();
        constsInstance = await Mock.new();
        await versionsRegistry.givenMethodReturnAddress(
            logicVersionsRegistryEncoder.encodeConsts(),
            constsInstance.address
        );
        await versionsRegistry.givenMethodReturnBool(
            logicVersionsRegistryEncoder.encodeHasLogicVersion(),
            true
        );
        settingsInstance = await Mock.new();
        await settingsInstance.givenMethodReturnAddress(
            settingsInterfaceEncoder.encodeVersionsRegistry(),
            versionsRegistry.address
        );
        instance = await ATMFactory.new();
        await instance.initialize(settingsInstance.address, { from: admin });
    });

    withData({
        _1_basic: [ ADMIN_INDEX, true, "TokenName", "TKN", 18, 1000, 20000, 1, undefined, false ],
        _2_notAdmin: [ 0, false, "TokenName", "TKN", 18, 1000, 20000, 1, true, "NOT_PAUSER" ],
    }, function(senderIndex, addAsPauserRole, name, symbol, decimals, cap, maxVesting, tlrInitialReward, mustFail, expectedErrorMessage) {
        it(t("admin", "createATM", "Should be able to create an ATM.", mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            if(!addAsPauserRole) {
                await settingsInstance.givenMethodRevertWithMessage(
                    settingsInterfaceEncoder.encodeRequirePauserRole(),
                    "NOT_PAUSER"
                );
            }
            try {
                // Invocation 
                const result = await instance.createATM(
                    name,
                    symbol,
                    decimals,
                    cap,
                    maxVesting,
                    tlrInitialReward,
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
                const tlrTokenExpected = await instance.getTLRToken(newATM);
                atmFactory
                    .atmCreated(result)
                    .emitted(sender, newATM, tlrTokenExpected);
                
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
