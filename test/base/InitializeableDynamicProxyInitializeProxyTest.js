// JS Libraries
const withData = require('leche').withData;
const { t, createMocks, NULL_ADDRESS, toBytes32 } = require('../utils/consts');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');
const LogicVersionsRegistryEncoder = require('../utils/encoders/LogicVersionsRegistryEncoder');
const { assert } = require('chai');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const InitializeableDynamicProxyMock = artifacts.require("./mock/base/InitializeableDynamicProxyMock.sol");

// Smart contracts

contract('InitializeableDynamicProxyInitializeProxyTest', function (accounts) {
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
        _1_valid: [undefined, 'NewLogicName', undefined, false],
        _2_previous: ['MyPreviousLogicName', 'NewLogicName', 'DYN_PROXY_ALREADY_INITIALIZED', true],
    }, function(previousLogicName, logicName, expectedErrorMessage, mustFail) {
        it(t('user', 'initializeProxy', 'Should (or not) be able to initialize the proxy.', mustFail), async function() {
            // Setup
            const logicNameBytes32 = toBytes32(web3, logicName);
            const sender = accounts[0];
            await versionsRegistry.givenMethodReturnBool(
                logicVersionsRegistryEncoder.encodeHasLogicVersion(),
                true
            );
            const previousSettings = await Mock.new();
            let previousLogicNameBytes32;
            if(previousLogicName !== undefined) {
                previousLogicNameBytes32 = toBytes32(web3, previousLogicName);
                await previousSettings.givenMethodReturnAddress(
                    settingsInterfaceEncoder.encodeVersionsRegistry(),
                    versionsRegistry.address
                );
                await instance.initializeProxy(
                    previousSettings.address,
                    previousLogicNameBytes32,
                    { from: sender }
                );
            }

            const settings = await Mock.new();
            await settings.givenMethodReturnAddress(
                settingsInterfaceEncoder.encodeVersionsRegistry(),
                versionsRegistry.address
            );

            try {
                // Invocation
                const result = await instance.initializeProxy(settings.address, logicNameBytes32, {from: sender});
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                const __isInitializedResult = await instance.__isInitialized();
                assert(__isInitializedResult);

                const settingsResult = await instance.settings();
                const logicNameResult = await instance.externalLogicName();

                if(previousLogicName !== undefined) {
                    assert.equal(settingsResult, previousSettings.address);
                    assert.equal(logicNameResult, previousLogicNameBytes32);
                } else {
                    assert.equal(settingsResult, settings.address);
                    assert.equal(logicNameResult, logicNameBytes32);
                }
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});