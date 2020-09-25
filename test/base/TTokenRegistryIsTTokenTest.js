// JS Libraries
const withData = require('leche').withData;
const { t, createMocks } = require('../utils/consts');
const { createTestSettingsInstance } = require("../utils/settings-helper");
const LogicVersionsRegistryEncoder = require('../utils/encoders/LogicVersionsRegistryEncoder');

// Mock Contracts
const Mock = artifacts.require('./mock/util/Mock.sol');

// Smart Contracts
const TTokenRegistry = artifacts.require('./base/TTokenRegistry.sol');
const Settings = artifacts.require("./base/Settings.sol");

contract('TTokenRegistryIsTTokenTest', function (accounts) {
    let instance;
    const logicVersionsRegistryEncoder = new LogicVersionsRegistryEncoder(web3);

    beforeEach('Setup for each test', async () => {
        const pauser = accounts[0];
        
        mocks = await createMocks(Mock, 10);
        const versionsRegistryInstance = await Mock.new();
        const constsInstance = await Mock.new();
        await versionsRegistryInstance.givenMethodReturnAddress(
            logicVersionsRegistryEncoder.encodeConsts(),
            constsInstance.address
        );

        const pairAggregatorRegistryInstance = await Mock.new();
        const settingsInstance = await createTestSettingsInstance(
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
                        atmSettings.address
                    );
                },
            },
        );
        instance = await TTokenRegistry.new();
        await instance.initialize(settingsInstance.address);
    });

    withData({
        _1_successful_check: [0, undefined, false],
        _2_unsuccessful_check: [1, "INVALID_ADDRESS", true],
    }, function(
        contractAddress,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'isTToken', 'Should be able to check if a given TToken contract has been registered.', mustFail), async function() {
            // Setup
            const tokenContract = await Mock.new();
            await instance.registerTToken(tokenContract.address, { from: accounts[0] });

            const tokenAdd = contractAddress === 0 ? tokenContract.address : accounts[3];

            try {
                // Invocation
                const result = await instance.isTToken(tokenAdd);

                console.log("RES<>", result);
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid');
                assert(result);
            } catch (error) {
                console.log("ERR<>", error);
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

})