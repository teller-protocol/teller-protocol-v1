// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
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
        const CETH = await Mock.new();
        const pauser = accounts[0];
        
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
                        atmSettings.address,
                        (await Mock.new()).address,
                        CETH.address
                    );
                },
            },
        );
        instance = await TTokenRegistry.new();
        await instance.initialize(settingsInstance.address);
    });

    withData({
        _1_registered_check: [0, true, undefined, false],
        _2_unregistered_check: [1, false, undefined, false],
    }, function(
        contractAddress,
        expectedReturn,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'isTToken', 'Should be able to check if a given TToken contract has been registered.', mustFail), async function() {
            // Setup
            const tokenContract = await Mock.new();
            await instance.registerTToken(tokenContract.address, { from: accounts[0] });

            const newTokenContract = await Mock.new();

            const tokenAdd = contractAddress === 0 ? tokenContract.address : newTokenContract.address;

            try {
                // Invocation
                const result = await instance.isTToken(tokenAdd);

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid');
                assert.equal(
                    result,
                    expectedReturn
                );
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

})