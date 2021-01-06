// JS Libraries
const withData = require('leche').withData;
const { t, createMocks } = require('../utils/consts');
const SettingsEncoder = require('../utils/encoders/SettingsEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const MarketsState = artifacts.require("./base/MarketsState.sol");

const actions = { Supply: 'Supply', Borrow: 'Borrow', Repay: 'Repay' };

contract('MarketsStateModifiersTest', function (accounts) {
    const settingsEncoder = new SettingsEncoder(web3);
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
        mocks = await createMocks(Mock, 10);
    });

    const newAmount = (amount, type, borrowedIndex, collateralIndex) => ({amount, type, borrowedIndex, collateralIndex});

    withData({
        _1_valid: [[1], 1, newAmount(1000, actions.Supply, 0, 1), undefined, false],
        _2_invalidAdmin: [[1, 2], 5, newAmount(1000, actions.Supply, 0, 1), 'WhitelistedRole: caller does not have the Whitelisted role', true],
    }, function(adminIndexes, senderIndex, action, expectedErrorMessage, mustFail) {
        it(t('user', 'onlyWhitelisted', 'Should be able (or not) to call the increase function.', mustFail), async function() {
            // Setup
            await settings.givenMethodReturnAddress(
                settingsEncoder.encodeGetCTokenAddress(),
                cTokenInstance.address
            );
            for (const adminIndex of adminIndexes) {
                const admin = accounts[adminIndex];
                await instance.addWhitelisted(admin, { from: owner });
            }
            const sender = accounts[senderIndex];
            const { type, borrowedIndex, collateralIndex, amount} = action;
            const borrowedAssset = mocks[borrowedIndex];
            const collateralAssset = mocks[collateralIndex];

            // Invocation
            try {
                let result;
                if(type === actions.Supply) {
                    result = await instance.increaseSupply(borrowedAssset, collateralAssset, amount, { from: sender });
                }
                if(type === actions.Borrow) {
                    result = await instance.increaseBorrow(borrowedAssset, collateralAssset, amount, { from: sender });
                }
                if(type === actions.Repay) {
                    result = await instance.increaseRepayment(borrowedAssset, collateralAssset, amount, { from: sender });
                }

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
