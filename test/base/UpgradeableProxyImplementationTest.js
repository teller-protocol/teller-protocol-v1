// JS Libraries
const withData = require("leche").withData;
const { t } = require("../utils/consts");

// Smart contracts
const AdminUpgradeabilityProxy = artifacts.require("./base/UpgradeableProxy.sol");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

contract("UpgradeableProxyImplementationTest", function(accounts) {
    let library

    before(async () => {
        library = await Mock.new();
    });

    withData({
        _1_basic: [ accounts[1], accounts[0] ],
    }, function(caller, admin) {
        it(t("user", "admin", "Should be able to get the current implementation address.", false), async function() {
            // Setup
            const proxy = await AdminUpgradeabilityProxy.new(library.address, admin, '0x');

            // Invocation
            const proxyImplementation = await proxy.implementation.call({ from: caller })
            assert.equal(library.address.toLowerCase(), proxyImplementation.toLowerCase())
        });
    });
});
