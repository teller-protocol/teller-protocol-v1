// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { tTokenRegistry } = require('../utils/events');
const LogicVersionsRegistryEncoder = require('../utils/encoders/LogicVersionsRegistryEncoder');

// Mock Contracts
const Mock = artifacts.require('./mock/util/Mock.sol');

// Smart Contracts
const TTokenRegistry = artifacts.require('./base/TTokenRegistry.sol');
const Settings = artifacts.require("./base/Settings.sol");

contract('TTokenRegistryRegisterTTokenTest', function (accounts) {
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
        
        const tokenContract = await Mock.new();
        await instance.registerTToken(tokenContract.address, { from: pauser });
    });

    withData({
        _1_successful_registeration_pauser: [0, 0, undefined, false],
        _2_unsuccessful_registration_pauser: [0, 1, 'ADDRESS_MUST_BE_CONTRACT', true],
        _3_unsuccessful_registration_not_pauser: [1, 0, 'NOT_PAUSER', true],
    }, function(
        senderAdd,
        contractAddress,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'registerTToken', 'Should (or should not) be able to register a TToken contract.', mustFail), async function() {
            // Setup
            const newTokenContract = await Mock.new();
            const newTokenAddress = newTokenContract.address;

            const sender = senderAdd === 0 ? accounts[0] : accounts[8];
            const tokenAdd = contractAddress === 0 ? newTokenAddress : NULL_ADDRESS;

            try {
                // Invocation
                let result = await instance.registerTToken(tokenAdd, { from: sender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid');
                assert(result);
                tTokenRegistry
                    .tTokenRegistered(result)
                    .emitted(tokenAdd, sender);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

})