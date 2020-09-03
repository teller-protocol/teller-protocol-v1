// JS Libraries
const withData = require("leche").withData;
const { t, createMocks, NULL_ADDRESS } = require("../utils/consts");

// Smart contracts
const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

contract("UpgradeableProxyInitializeProxyTest", function(accounts) {
    let instance;
    let mocks;

    before(async () => {
        mocks = await createMocks(Mock, 10);
        instance = await UpgradeableProxy.new();
    });

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_basic: [ 2, 3, false, undefined ],
        _2_settings_not_contract: [ 99, 3, true, 'SETTINGS_NOT_A_CONTRACT' ],
        _3_settings_empty: [ -1, 3, true, 'SETTINGS_NOT_A_CONTRACT' ],
        _4_init_logic_empty: [ 2, -1, true, 'INITIAL_LOGIC_NOT_A_CONTRACT' ],
        _5_init_logic_not_contract: [ 2, 99, true, 'INITIAL_LOGIC_NOT_A_CONTRACT' ],
    }, function(settingsIndex, initLogicIndex, mustFail, expectedErrorMessage) {
        it(t("user", "initializeProxy", "Should be able to initialize the proxy.", mustFail), async function() {
            // Setup
            const settingsAddress = getInstance(mocks, settingsIndex, 2);
            const initLogicAddress = getInstance(mocks, initLogicIndex, 3);

            try {
                // Invocation
                const result = await instance.initializeProxy(settingsAddress, initLogicAddress);

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                const expectedSettings = await instance.settings();

                assert.equal(expectedSettings, settingsAddress);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
