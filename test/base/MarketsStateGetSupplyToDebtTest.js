// JS Libraries
const withData = require('leche').withData;
const { t, createMocks } = require('../utils/consts');
const actions = require('../utils/marketStateActions.js');
const SettingsEncoder = require('../utils/encoders/SettingsEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const CERC20Mock = artifacts.require("./mock/providers/compound/CERC20Mock.sol");
const ERC20Mock = artifacts.require("./mock/token/ERC20Mock.sol");

// Smart contracts
const MarketsState = artifacts.require("./base/MarketsState.sol");

contract('MarketsStateGetDebtToSupplyTest', function (accounts) {
    const settingsEncoder = new SettingsEncoder(web3);
    const owner = accounts[0];
    let mocks;
    let instance;
    let settings;
    let cTokenInstance;
    let underlyingTokenInstance;
    
    beforeEach('Setup for each test', async () => {
        underlyingTokenInstance = await ERC20Mock.new('', '', 18, 10000);
        cTokenInstance = await CERC20Mock.new('', '', 18, underlyingTokenInstance.address, 1);
        settings = await Mock.new();
        instance = await MarketsState.new();
        await instance.initialize(settings.address);
        await instance.addWhitelisted(owner, { from: owner});
        mocks = await createMocks(Mock, 10);
    });

    const newAmount = (amount, type, borrowedIndex, collateralIndex) => ({amount, type, borrowedIndex, collateralIndex});

    withData({
        // 2000 Supply / (500 borrow - 100 repay) = 5
        _1_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 0, 1),
                newAmount(1000, actions.Inc_Supply, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
                newAmount(100, actions.Repay, 0, 1),
            ], 0, 1, 5 * 10000
        ],
        // 2000 Supply / (2000 borrow - 1000 repay) = 2
        _2_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 0, 1),
                newAmount(1000, actions.Inc_Supply, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
                newAmount(500, actions.Repay, 0, 1),
                newAmount(500, actions.Repay, 0, 1),
                newAmount(1500, actions.Borrow, 0, 1),
            ], 0, 1, 2 * 10000
        ],
        // 2500 Supply / (2500 borrow - 0 repay) = 1
        _3_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
                newAmount(1500, actions.Inc_Supply, 0, 1),
                newAmount(1500, actions.Borrow, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
            ], 0, 1, 1 * 10000
        ],
        // 1000 Supply / (0 borrow - 0 repay) = 0
        _4_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 0, 1),
            ], 0, 1, 0 * 10000
        ],
        // 0 Supply / (0 borrow - 0 repay) = 0
        _5_scenario: [
            [], 0, 1, 0 * 10000
        ],
        // 500 Supply / (500 borrow - 0 repay) = 1
        _6_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 1, 3),
                newAmount(500, actions.Borrow, 1, 3),
                newAmount(500, actions.Dec_Supply, 1, 3),
            ], 1, 3, 1 * 10000
        ],
        // 300 Supply / (700 borrow - 400 repay) = 1
        _7_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 1, 3),
                newAmount(500, actions.Borrow, 1, 3),
                newAmount(800, actions.Inc_Supply, 1, 3),
                newAmount(400, actions.Repay, 1, 3),
                newAmount(500, actions.Dec_Supply, 1, 3),
                newAmount(200, actions.Borrow, 1, 3),
                newAmount(1000, actions.Dec_Supply, 1, 3),
            ], 1, 3, 1 * 10000
        ],
        // 2500 Supply / (2000 borrow - 2040 repay + 0 newLoanAmount) = 0
        _8_scenario: [
            [
                newAmount(1000, actions.Inc_Supply, 0, 1),
                newAmount(500, actions.Borrow, 0, 1),
                newAmount(1500, actions.Inc_Supply, 0, 1),
                newAmount(520, actions.Repay, 0, 1),
                newAmount(1500, actions.Borrow, 0, 1),
                newAmount(1520, actions.Repay, 0, 1),
            ], 0, 1, 0
        ],
    }, function(previousAmounts, borrowedIndexToTest, collateralIndexToTest, expectedResult) {
        it(t('user', 'getDebtToSupply', 'Should be able to get the supply to debt value.', false), async function() {
            // Setup
            await settings.givenMethodReturnAddress(
                settingsEncoder.encodeGetCTokenAddress(),
                cTokenInstance.address
            );

            await cTokenInstance.setMockExchangeRate(200);

            for (const { amount, type, borrowedIndex, collateralIndex } of previousAmounts) {
                const borrowedAssset = mocks[borrowedIndex];
                const collateralAssset = mocks[collateralIndex];
                
                await actions.execute(instance, type, {borrowedAssset, collateralAssset, amount }, { from: owner });
            }
            const borrowedAsssetToTest = mocks[borrowedIndexToTest];
            const collateralAsssetToTest = mocks[collateralIndexToTest];

            // Invocation
            const result = await instance.getDebtRatio(
                borrowedAsssetToTest,
                collateralAsssetToTest
            );

            // Assertions
            assert.equal(result.toString(), expectedResult.toString());
        });
    });
});
