// JS Libraries
const withData = require("leche").withData;
const { t } = require("./utils/consts");

// Smart contracts
const AdminUpgradeabilityProxy = artifacts.require("./base/UpgradeableProxy.sol");
const UpgradableV1 = artifacts.require("./mock/upgradable/UpgradableV1.sol");
const UpgradableV2 = artifacts.require("./mock/upgradable/UpgradableV2.sol");

contract("UpgradeableProxyTest", function(accounts) {
    let v1LibraryInstance;
    let v2LibraryInstance;
    let v1InitData;
    let initValue = 43;

    beforeEach("Setup for each test", async () => {
        v1LibraryInstance = await UpgradableV1.new();
        v2LibraryInstance = await UpgradableV2.new();

        v1InitData = v1LibraryInstance.contract.methods.initialize(initValue).encodeABI();
    });

    withData({
        _1_only_admin_upgrade: [ accounts[1], accounts[0], false, true, "UPGRADABLE_CALLER_MUST_BE_ADMIN" ],
        _2_successful: [ accounts[0], accounts[0], false, false, null ],
        _3_initialize_after_constructor: [ accounts[0], accounts[0], true, false, null ]
    }, function(caller, admin, initAfter, mustFail, expectedErrorMessage) {
        it(t("admin", "upgradeTo", "Should be able to (or not) upgrade the functionality of a contract.", mustFail), async function() {
            try {
                // Setup
                const initData = initAfter ? "0x" : v1InitData;
                const proxy = await AdminUpgradeabilityProxy.new(v1LibraryInstance.address, admin, initData);
                const v1 = await UpgradableV1.at(proxy.address);
                const v2 = await UpgradableV2.at(proxy.address);

                // Invocation
                if (initAfter) {
                    await v1.initialize(initValue);
                }

                const implementationV1 = await proxy.implementation.call();
                assert.equal(implementationV1.toLowerCase(), v1LibraryInstance.address.toLowerCase(), "V1 implementation addresses do not match");

                const v1Value = await v1.value.call();
                assert.equal(initValue.toString(), v1Value.toString(), "Initial values do not match");

                await proxy.upgradeTo(v2LibraryInstance.address, { from: caller });
                const implementationV2 = await proxy.implementation.call();
                assert.equal(implementationV2.toLowerCase(), v2LibraryInstance.address.toLowerCase(), "V2 implementation addresses do not match");

                const newValue = 1234;
                await v2.setValue(newValue);

                const updatedValue = await v1.value.call();
                assert.equal(updatedValue.toString(), newValue.toString(), "Updated values do not match");
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
