// JS Libraries
const withData = require('leche').withData;
const { t, createMocks } = require('../utils/consts');
const actions = require('../utils/marketStateActions.js');
const { encodeAssetSettings } = require('../utils/assetSettings');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const MarketsState = artifacts.require("./base/MarketsState.sol");

contract('MarketsStateGetMarketTest', function (accounts) {
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    const owner = accounts[0];
    let mocks;
    let instance;
    let settings;
    let cTokenInstance;
    
    beforeEach('Setup for each test', async () => {
        cTokenInstance = await Mock.new();
        settings = await Mock.new();
        instance = await MarketsState.new();
        await instance.initialize(settings.address);
        await instance.addWhitelisted(owner, { from: owner});
        mocks = await createMocks(Mock, 10);
    });

    const newAmount = (amount, type, borrowedIndex, collateralIndex) => ({amount, type, borrowedIndex, collateralIndex});
    const newExpected = (totalSupplied, totalRepaid, totalBorrowed) => ({totalSupplied, totalRepaid, totalBorrowed});

    withData({
        // (500 borrow - 100 repay) / 2000 Supply = 0.2
        _1_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 0, 1),
                newAmount(1000, actions.Inc_Supply, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
                newAmount(100, actions.Repay, 0, 1),
            ], 0, 1, newExpected(2000, 100, 500)
        ],
        // (2000 borrow - 1000 repay) / 2000 Supply = 0.5
        _2_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 0, 1),
                newAmount(1000, actions.Inc_Supply, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
                newAmount(500, actions.Repay, 0, 1),
                newAmount(1500, actions.Borrow, 0, 1),
                newAmount(500, actions.Repay, 0, 1),
            ], 0, 1, newExpected(2000, 1000, 2000)
        ],
        // (2500 borrow - 0 repay) / 2500 Supply = 1
        _3_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
                newAmount(1500, actions.Inc_Supply, 0, 1),
                newAmount(1500, actions.Borrow, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
            ], 0, 1, newExpected(2500, 0, 2500)
        ],
        // (0 borrow - 0 repay) / 1000 Supply = 0
        _4_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 0, 1),
            ], 0, 1, newExpected(1000, 0, 0)
        ],
        // (0 borrow - 0 repay) / 0 Supply = 0
        _5_scenario: [
            [], 0, 1, newExpected(0, 0, 0)
        ],
        _6_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
                newAmount(1500, actions.Inc_Supply, 0, 1),
                newAmount(1500, actions.Borrow, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
            ], 1, 0, newExpected(0, 0, 0)
        ],
        _7_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 1, 3),
                newAmount(500, actions.Borrow, 1, 3),
                newAmount(500, actions.Dec_Supply, 1, 3),
            ], 1, 3, newExpected(500, 0, 500)
        ],
        _8_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 1, 3),
                newAmount(500, actions.Borrow, 1, 3),
                newAmount(800, actions.Inc_Supply, 1, 3),
                newAmount(400, actions.Repay, 1, 3),
                newAmount(500, actions.Dec_Supply, 1, 3),
                newAmount(200, actions.Borrow, 1, 3),
                newAmount(1000, actions.Dec_Supply, 1, 3),
            ], 1, 3, newExpected(300, 400, 700)
        ],
    }, function(previousAmounts, borrowedIndexToTest, collateralIndexToTest, expectedResult) {
        it(t('user', 'getMarket', 'Should be able to get the market info.', false), async function() {
            // Setup
            await settings.givenMethodReturn(
                settingsInterfaceEncoder.encodeGetAssetSettings(),
                encodeAssetSettings(web3, { cTokenAddress: cTokenInstance.address })
            );
            for (const { amount, type, borrowedIndex, collateralIndex } of previousAmounts) {
                const borrowedAssset = mocks[borrowedIndex];
                const collateralAssset = mocks[collateralIndex];

                await actions.execute(instance, type, {borrowedAssset, collateralAssset, amount }, { from: owner });
            }
            const borrowedAsssetToTest = mocks[borrowedIndexToTest];
            const collateralAsssetToTest = mocks[collateralIndexToTest];

            // Invocation
            const result = await instance.getMarket(
                borrowedAsssetToTest,
                collateralAsssetToTest
            );

            // Assertions
            assert.equal(result.totalSupplied.toString(), expectedResult.totalSupplied.toString());
            assert.equal(result.totalRepaid.toString(), expectedResult.totalRepaid.toString());
            assert.equal(result.totalBorrowed.toString(), expectedResult.totalBorrowed.toString());
        });
    });
});