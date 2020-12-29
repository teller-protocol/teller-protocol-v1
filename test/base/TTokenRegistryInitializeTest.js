// JS Libraries
const withData = require('leche').withData;
const { t, createMocks, NULL_ADDRESS } = require('../utils/consts');
const { createTestSettingsInstance } = require("../utils/settings-helper");
const LogicVersionsRegistryEncoder = require('../utils/encoders/LogicVersionsRegistryEncoder');

// Mock Contracts
const Mock = artifacts.require('./mock/util/Mock.sol');

// Smart Contracts
const TTokenRegistry = artifacts.require('./base/TTokenRegistry.sol');
const Settings = artifacts.require("./base/Settings.sol");

contract('TTokenRegistryInitializeTest', function (accounts) {
    const logicVersionsRegistryEncoder = new LogicVersionsRegistryEncoder(web3);
    let instance;
    let settingsInstance;

    beforeEach('Setup for each test', async () => {
        const CETH = await Mock.new();
        const pauser = accounts[0];
        const versionsRegistryInstance = await Mock.new();
        const constsInstance = await Mock.new();
        await versionsRegistryInstance.givenMethodReturnAddress(
            logicVersionsRegistryEncoder.encodeConsts(),
            constsInstance.address
        );

        const pairAggregatorRegistryInstance = await Mock.new();
        settingsInstance = await createTestSettingsInstance(
            Settings,
            {
                from: pauser,
                Mock,
                onInitialize: async (
                    instance,
                    {
                        escrowFactory,
                        marketsState,
                        interestValidator,
                        atmSettings,
                    }) => {
                    await instance.initialize(
                        escrowFactory.address,
                        versionsRegistryInstance.address,
                        pairAggregatorRegistryInstance.address,
                        marketsState.address,
                        interestValidator.address,
                        atmSettings.address,
                        (await Mock.new()).address,
                        CETH.address
                    );
                },
            },
        );
        
        instance = await TTokenRegistry.new();
        
    });

    withData({
        _1_valid_settings_initialize: [0, undefined, false],
        _2_invalid_settings_initialize: [1, "SETTINGS_NOT_A_CONTRACT", true],
    }, function(
        contractAddress,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'initialize', 'Should (or should not) be able to initialize the TTokenRegistry contract.', mustFail), async function() {
            // Setup
            

            const settingsAdd = contractAddress === 0 ? settingsInstance.address : NULL_ADDRESS;

            try {
                // Invocation
                const result = await instance.initialize(settingsAdd);

                const isInitialized = await instance.initialized();

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid');
                assert(result);
                assert(isInitialized);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

})