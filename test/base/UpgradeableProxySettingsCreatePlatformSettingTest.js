// JS Libraries
const withData = require("leche").withData;
const { t, toBytes32 } = require("../utils/consts");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");
const Settings = artifacts.require("./base/Settings.sol");
const { createTestSettingsInstance } = require("../utils/settings-helper");

contract("UpgradeableProxySettingsCreatePlatformSettingTest", function(accounts) {
    let settings;
    let owner;
    
    beforeEach("Setup for each test", async () => {
        owner = accounts[0];
        settings = await createTestSettingsInstance(
            Settings,
            {
                from: owner,
                Mock
            },
        );
    });

    withData({
        _1_basic: [ accounts[1], accounts[0], false, undefined ],

    }, function(caller, admin, mustFail, expectedErrorMessage) {
        it(t("admin", "createPlatformSetting", "Should be able to use multiple proxies of a contract and all share the same state.", mustFail), async function() {
            try {
                // Setup
                const initLogic = await Mock.new();
                const v1 = await UpgradeableProxy.new();
                await v1.initializeProxy(settings.address, initLogic.address, { from: admin });
                const proxySettings = await v1.settings();
                const settingsOfProxy1 = await Settings.at(proxySettings);
                const settingsOfProxy2 = await Settings.at(proxySettings);
                // Invocation using proxy 1
                await settingsOfProxy2.addPauser(caller, { from: admin })
                
                // Validating state change using proxy 2
                const settingsOfProxyIsPauser2 = await settingsOfProxy2.isPauser(caller);
                assert.equal(settingsOfProxyIsPauser2, true);

                // Invocation using proxy 2
                const settingName = toBytes32(web3, 'MyCustom');
                console.log("NAME>>>", settingName);
                const res = await settingsOfProxy2.createPlatformSetting(
                    settingName,
                    100,
                    0,
                    2000,
                    { from: caller }
                );
                console.log("RES>>>", res);

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
