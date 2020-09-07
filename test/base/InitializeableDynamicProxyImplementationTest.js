// JS Libraries
const withData = require('leche').withData;
const { t, createMocks, NULL_ADDRESS, toBytes32 } = require('../utils/consts');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');
const LogicVersionsRegistryEncoder = require('../utils/encoders/LogicVersionsRegistryEncoder');
const { assert } = require('chai');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const InitializeableDynamicProxyMock = artifacts.require("./mock/base/InitializeableDynamicProxyMock.sol");
const UpgradableV1 = artifacts.require("./mock/upgradable/UpgradableV1.sol");

// Smart contracts

contract('InitializeableDynamicProxyImplementationTest', function (accounts) {
    const logicVersionsRegistryEncoder = new LogicVersionsRegistryEncoder(web3);
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let instance;
    let versionsRegistry;
    
    beforeEach('Setup for each test', async () => {
        mocks = await createMocks(Mock, 10);
        instance = await InitializeableDynamicProxyMock.new();

        versionsRegistry = await Mock.new();
    });

    withData({
        _1_initialize_proxy: [true, 'NewLogicName1', undefined, false],
        _2_not_initialize_proxy: [true, 'NewLogicName2', undefined, false],
    }, function(initializeProxy, logicName, expectedErrorMessage, mustFail) {
        it(t('user', 'implementation', 'Should (or not) be able to get the implementation.', mustFail), async function() {
            // Setup
            const sender = accounts[0];
            const logicNameBytes32 = toBytes32(web3, logicName);
            const settings = await Mock.new();
            let initializeProxyImpl;
            if(initializeProxy) {
                initializeProxyImpl = await Mock.new();
                await versionsRegistry.givenMethodReturnBool(
                    logicVersionsRegistryEncoder.encodeHasLogicVersion(),
                    true
                );
                await versionsRegistry.givenMethodReturnAddress(
                    logicVersionsRegistryEncoder.encodeGetLogicVersionAddress(),
                    initializeProxyImpl.address
                );
                await settings.givenMethodReturnAddress(
                    settingsInterfaceEncoder.encodeVersionsRegistry(),
                    versionsRegistry.address
                );
                await instance.initializeProxy(settings.address, logicNameBytes32, {from: sender});
            } else {
                initializeProxyImpl = await UpgradableV1.new();
                await initializeProxyImpl.initialize('2');
            }

            try {
                // Invocation
                const result = await instance.externalImplementation();
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                assert.equal(result, initializeProxyImpl.address);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});