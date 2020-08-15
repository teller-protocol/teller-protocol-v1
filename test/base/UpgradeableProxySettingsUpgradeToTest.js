// JS Libraries
const withData = require("leche").withData;
const { t, toBytes32 } = require("../utils/consts");

// Smart contracts
const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");
const Settings = artifacts.require("./base/Settings.sol");
const SettingsInterface = artifacts.require("./interfaces/SettingsInterface.sol");

contract("UpgradeableProxySettingsUpgradeToTest", function(accounts) {

    beforeEach("Setup for each test", async () => {

    });

    withData({
        _1_basic: [ accounts[1], accounts[0], false, "aaaaa" ],

    }, function(caller, admin, mustFail, expectedErrorMessage) {
        it(t("admin", "upgradeTo", "Should be able to (or not) upgrade the functionality of a contract.", mustFail), async function() {
            try {
                // Setup
                const initData = '0x';
                const settings = await Settings.new();
                const proxy = await UpgradeableProxy.new(settings.address, admin, initData);
                const settingsOfProxy = await Settings.at(proxy.address);
                await settingsOfProxy.initialize(caller);
                const settingsOfSettings = await Settings.at(settings.address);
                
                // Invocation
                await settingsOfProxy.createPlatformSetting(
                    toBytes32(web3, 'MyCustom'),
                    '100',
                    '0',
                    '2000',
                    { from: caller }
                );

                const settingsOfProxyIsPauser = await settingsOfProxy.isPauser(caller);
                assert.equal(settingsOfProxyIsPauser, true);
                const settingsOfSettingsIsPauser = await settingsOfSettings.isPauser(caller);
                assert.equal(settingsOfSettingsIsPauser, true);
            } catch (error) {
                console.log(error);
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
