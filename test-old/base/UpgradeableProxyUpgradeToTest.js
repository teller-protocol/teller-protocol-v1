// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS } = require("../utils/consts");
const {
    upgradeable
} = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");
const Settings = artifacts.require("./base/Settings.sol");
const { createTestSettingsInstance } = require("../utils/settings-helper");

contract("UpgradeableProxyUpgradeToTest", function(accounts) {
    let settings;
    let initLogic;

    beforeEach("Setup for each test", async () => {
        const owner = accounts[0];
        settings = await createTestSettingsInstance(
            Settings,
            {
                from: owner,
                Mock
            },
        );
        initLogic = await Mock.new();
    });

    withData({
        _1_valid_newLogic: [accounts[1], accounts[0], true, true, false, undefined ],
        _2_non_contract: [accounts[1], accounts[0], false, true, true, 'Cannot set a proxy implementation to a non-contract address' ],
        _3_not_pauser: [accounts[1], accounts[0], true, false, true, 'NOT_PAUSER' ],
    }, function(
        caller,
        admin,
        newLogic,
        isPauser,
        mustFail,
        expectedErrorMessage
    ) {
        it(t("caller", "upgrade", "Should be able to (or not) upgrade proxy logic.", mustFail), async function() {
            try {
                // Setup
                const proxy = await UpgradeableProxy.new();
                await proxy.initializeProxy(settings.address, initLogic.address, { from: admin });
                const newLogicInstance = await Mock.new();

                if (isPauser) {
                    const settingsAdd = await proxy.settings();
                    const settingsAtProxy = await Settings.at(settingsAdd);
                    await settingsAtProxy.addPauser(caller, { from: admin })
                }

                // Pre Assertions
                const initImplementation = await proxy.implementation.call()
                assert.equal(initImplementation, initLogic.address, 'Initial logic implementation incorrect.')

                // Invocation
                let result;
                if (newLogic) {
                    result = await proxy.upgradeTo(newLogicInstance.address, { from: caller });
                } else {
                    result = await proxy.upgradeTo(NULL_ADDRESS, { from: caller });
                }

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                const upgradedImplementation = await proxy.implementation.call()
                assert.equal(upgradedImplementation, newLogicInstance.address, 'Upgraded logic implementation incorrect.')

                // Validating events were emitted
                upgradeable
                    .upgraded(result)
                    .emitted(newLogicInstance.address);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
