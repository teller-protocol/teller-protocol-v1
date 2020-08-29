// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks, ETH_ADDRESS, } = require('../utils/consts');
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { marketFactory } = require('../utils/events');
const ChainlinkPairAggregatorRegistryEncoder = require('../utils/encoders/ChainlinkPairAggregatorRegistryEncoder');
const LogicVersionsRegistryEncoder = require('../utils/encoders/LogicVersionsRegistryEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const MarketFactory = artifacts.require("./base/MarketFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('MarketFactoryCreateMarketTest', function (accounts) {
    const owner = accounts[0];
    const chainlinkPairAggregatorRegistryEncoder = new ChainlinkPairAggregatorRegistryEncoder(web3);
    const logicVersionsRegistryEncoder = new LogicVersionsRegistryEncoder(web3);
    let instance;
    let settingsInstance;
    let marketsInstance;
    let atmSettingsInstance;
    let interestValidatorInstance;
    let versionsRegistryInstance;
    let pairAggregatorRegistryInstance;

    
    beforeEach('Setup for each test', async () => {
        mocks = await createMocks(Mock, 10);
        settingsInstance = await createTestSettingsInstance(Settings, { from: owner, Mock });
        marketsInstance = await Mock.new();
        atmSettingsInstance = await Mock.new();
        interestValidatorInstance = await Mock.new();
        versionsRegistryInstance = await Mock.new();
        pairAggregatorRegistryInstance = await Mock.new();
        instance = await MarketFactory.new();
        await instance.initialize(
            settingsInstance.address,
            atmSettingsInstance.address,
            marketsInstance.address,
            interestValidatorInstance.address,
            versionsRegistryInstance.address,
            pairAggregatorRegistryInstance.address
        )
    });

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_basic: [0, false, 2, 3, 4, 5, 6, false, undefined],
        _2_platform_paused: [0, true, 2, 3, 4, 5, 6, true, 'PLATFORM_IS_PAUSED'],
        _3_not_pauser_role: [4, false, 2, 3, 4, 5, 6, true, 'NOT_PAUSER'],
        _4_ttoken_not_contract: [0, false, 99, 3, 4, 5, 6, true, 'TTOKEN_MUST_BE_CONTRACT'],
        _5_ttoken_empty: [0, false, -1, 3, 4, 5, 6, true, 'TTOKEN_MUST_BE_CONTRACT'],
        //FIX  _6_borrowed_token_empty: [0, false, 2, 99, 4, 5, 6, true, 'BORROWED_TOKEN_MUST_BE_CONTRACT'],
        _7_coll_token_eth: [0, false, 2, 3, 100, 5, 6, false, undefined],
        _8_coll_token_not_contract: [0, false, 2, 3, 99, 5, 6, true, 'COLL_TOKEN_MUST_BE_CONTRACT'],
        _9_coll_token_empty: [0, false, 2, 3, -1, 5, 6, true, 'COLL_TOKEN_MUST_BE_CONTRACT'],
    }, function(
        senderIndex,
        pausePlatform,
        tTokenIndex,
        borrowedTokenIndex,
        collateralTokenIndex,
        getPairAggregatorResponseIndex,
        cTokenAddressResponseIndex,
        mustFail,
        expectedErrorMessage,
    ) {
        it(t('user', 'createMarket', 'Should able (or not) to create a market correctly.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const tTokenAddress = getInstance(mocks, tTokenIndex, 2);
            const borrowedTokenAddress = getInstance(mocks, borrowedTokenIndex, 3);
            const collateralTokenAddress = collateralTokenIndex === 100 ? ETH_ADDRESS : getInstance(mocks, collateralTokenIndex, 4);
            const encodeGetPairAggregatorResponse = getInstance(mocks, getPairAggregatorResponseIndex, 5);
            const cTokenAddressResponse = getInstance(mocks, cTokenAddressResponseIndex, 5);
            await versionsRegistryInstance.givenMethodReturnBool(
                logicVersionsRegistryEncoder.encodeHasLogicVersion(),
                true
            );
            await pairAggregatorRegistryInstance.givenMethodReturnAddress(
                chainlinkPairAggregatorRegistryEncoder.encodeGetPairAggregator(),
                encodeGetPairAggregatorResponse
            );
            await settingsInstance.createAssetSettings(
                borrowedTokenAddress,
                cTokenAddressResponse,
                '10000',
                { from: owner }
            );
            if(pausePlatform) {
                await settingsInstance.pause({ from: owner });
            }
            
            try {
                // Invocation
                const result = await instance.createMarket(
                    tTokenAddress,
                    borrowedTokenAddress,
                    collateralTokenAddress,
                    { from: sender }
                );

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                const newMarket = await instance.getMarket(borrowedTokenAddress, collateralTokenAddress);

                assert(newMarket.exists);
                marketFactory
                    .newMarketCreated(result)
                    .emitted(
                        sender,
                        borrowedTokenAddress,
                        collateralTokenAddress,
                        newMarket.loans,
                        newMarket.lenders,
                        newMarket.lendingPool,
                        newMarket.loanTermsConsensus,
                        newMarket.interestConsensus,
                        newMarket.pairAggregator,
                    );
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }

        })

    })

})