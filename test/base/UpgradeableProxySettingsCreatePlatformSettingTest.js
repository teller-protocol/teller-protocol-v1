// JS Libraries
const withData = require("leche").withData;
const { t, toBytes32 } = require("../utils/consts");

// Smart contracts
const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");
const Settings = artifacts.require("./base/Settings.sol");
const SettingsInterface = artifacts.require("./interfaces/SettingsInterface.sol");

contract("UpgradeableProxySettingsCreatePlatformSettingTest", function(accounts) {

    beforeEach("Setup for each test", async () => {

    });

    withData({
        _1_basic: [ accounts[1], accounts[0], false, "aaaaa" ],

    }, function(caller, admin, mustFail, expectedErrorMessage) {
        it(t("admin", "createPlatformSetting", "Should be able to use multiple proxies of a contract and all share the same state.", mustFail), async function() {
            try {
                // Setup
                const initData = '0x';
                const settings = await Settings.new();
                const v1 = await UpgradeableProxy.new(settings.address, admin, initData);
                const settingsOfProxy1 = await Settings.at(v1.address);
                const settingsOfProxy2 = await Settings.at(v1.address);
                
                // Invocation using proxy 1
                await settingsOfProxy1.initialize(caller);
                
                // Validating state change using proxy 2
                const settingsOfProxyIsPauser2 = await settingsOfProxy2.isPauser(caller);
                assert.equal(settingsOfProxyIsPauser2, true);

                // Invocation using proxy 2
                await settingsOfProxy2.createPlatformSetting(
                    toBytes32(web3, 'MyCustom'),
                    '100',
                    '0',
                    '2000',
                    { from: caller }
                );

                // Validating state change using proxy 1
                const platformSetting = await settingsOfProxy1.getPlatformSetting(
                    toBytes32(web3, 'MyCustom'), 
                    { from: caller }
                );
                assert.equal(platformSetting.value.toString(), "100");
                
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
