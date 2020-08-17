// JS Libraries
const withData = require("leche").withData;
const { t, toBytes32 } = require("../utils/consts");
const { settingsABI } = require("../../migrations/utils/encodeAbis");

// Smart contracts
const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");
const Settings = artifacts.require("./base/Settings.sol");
const SettingsInterface = artifacts.require("./interfaces/SettingsInterface.sol");

contract("UpgradeableProxySettingsUpgradeToTest", function(accounts) {

    beforeEach("Setup for each test", async () => {

    });

    withData({
        _1_valid_using_initData: [accounts[1], accounts[0], true, false, false, false, undefined ],
        _2_valid_using_initialize: [accounts[1], accounts[0], false, true, false, false, undefined ],
        _3_invalid_using_both: [accounts[1], accounts[0], true, true, true, true, 'Contract instance has already been initialized' ],
        _4_valid_using_initialize_and_original_initialize: [accounts[1], accounts[0], false, true, true, false, undefined ],
    }, function(caller, admin, doInitData, doCallInitialize, doCallOriginalInitialize, mustFail, expectedErrorMessage) {
        it(t("admin", "initialize", "Should be able to (or not) initialize a contract / proxy.", mustFail), async function() {
            try {
                // Setup
                const settings = await Settings.new();

                let initData = '0x';
                if (doInitData) {
                    initData = settingsABI.encodeInitData(web3, caller);
                }
                const proxy = await UpgradeableProxy.new(settings.address, admin, initData);
                const settingsOfProxy = await Settings.at(proxy.address);
                if(doCallInitialize) {
                    await settingsOfProxy.initialize(caller);
                }
                const settingsOfSettings = await Settings.at(settings.address);
                if(doCallOriginalInitialize) {
                    await settingsOfSettings.initialize(caller);   
                }
                
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
                if(doCallOriginalInitialize) {
                    const settingsOfSettingsIsPauser = await settingsOfSettings.isPauser(caller);
                    console.log(`settingsOfSettingsIsPauser:    ${settingsOfSettingsIsPauser}`);
                    assert.equal(settingsOfSettingsIsPauser, true);
                }
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
