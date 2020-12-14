// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, toBytes32 } = require('../utils/consts');
const { lendingPool } = require('../utils/events');
const { initContracts } = require('../utils/contracts');
const BurnableInterfaceEncoder = require('../utils/encoders/BurnableInterfaceEncoder');
const CompoundInterfaceEncoder = require('../utils/encoders/CompoundInterfaceEncoder');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const CTokenInterfaceEncoder = require('../utils/encoders/CTokenInterfaceEncoder')
const { createTestSettingsInstance } = require("../utils/settings-helper");
const settingsNames = require("../utils/platformSettingsNames");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const Token = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");
const TDAI = artifacts.require("./base/TDAI.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('LendingPoolWithdrawTest', function (accounts) {
    const burnableInterfaceEncoder = new BurnableInterfaceEncoder(web3);
    const compoundInterfaceEncoder = new CompoundInterfaceEncoder(web3);
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    const cTokenEncoder = new CTokenInterfaceEncoder(web3)

    let instance;
    let loansInstance;
    let consensusInstance;
    let cTokenInstance;
    let settingsInstance;
    let marketsInstance;
    
    beforeEach('Setup for each test', async () => {
        loansInstance = await Mock.new();
        consensusInstance = await Mock.new();
        cTokenInstance = await Mock.new();
        marketsInstance = await Mock.new();
        instance = await LendingPool.new();
        settingsInstance = await createTestSettingsInstance(
            Settings,
            { 
                from: accounts[0],
                Mock,
                initialize: true,
                onInitialize: async(instance, { marketsState }) => {
                    marketsInstance = marketsState;
                }});
    });

    withData({
        _1_basic: [accounts[0], true, 10, false, 1000, undefined, false],
        _2_transferFail: [accounts[1], false, 50, false, 1000, 'SafeERC20: ERC20 operation did not succeed', true],
        _3_compoundFail: [accounts[1], true, 50, true, 1000, 'COMPOUND_REDEEM_UNDERLYING_ERROR', true],
        _4_balanceFail: [accounts[0], true, 10, false, 0, 'LENDING_TOKEN_NOT_ENOUGH_BALANCE', true],
    }, function(
        recipient,
        transfer,
        amountToWithdraw,
        compoundFails,
        balanceOf,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'withdraw', 'Should able (or not) to withdraw DAIs.', mustFail), async function() {
            // Setup
            const tTokenInstance = await Mock.new();
            const lendingTokenInstance = await Mock.new();
            await cTokenInstance.givenMethodReturnAddress(
              cTokenEncoder.encodeUnderlying(),
              lendingTokenInstance.address
            )

            await settingsInstance.createAssetSettings(lendingTokenInstance.address, cTokenInstance.address, 1000, { from: accounts[0] });

            await initContracts(
                settingsInstance,
                cTokenInstance,
                instance,
                tTokenInstance,
                consensusInstance,
                lendingTokenInstance,
                loansInstance,
                Lenders,
            );
            const encodeTransfer = burnableInterfaceEncoder.encodeTransfer();
            await lendingTokenInstance.givenMethodReturnBool(encodeTransfer, transfer);

            const redeemResponse = compoundFails ? 1 : 0
            const encodeRedeemUnderlying = compoundInterfaceEncoder.encodeRedeemUnderlying();
            await cTokenInstance.givenMethodReturnUint(encodeRedeemUnderlying, redeemResponse);

            const encodeBalanceOf = erc20InterfaceEncoder.encodeBalanceOf();
            await lendingTokenInstance.givenMethodReturnUint(encodeBalanceOf, balanceOf);

            try {
                // Invocation
                const result = await instance.withdraw(amountToWithdraw, { from: recipient });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                lendingPool
                    .tokenWithdrawn(result)
                    .emitted(recipient, amountToWithdraw);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_basic: [accounts[0], 100, accounts[0], 10, undefined, false],
        _2_recipientNotEnoughTDaiBalance: [accounts[0], 99, accounts[0], 100, 'ERC20: burn amount exceeds balance', true],
        _3_recipientNotTDaiBalance: [accounts[0], 100, accounts[1], 10, 'ERC20: burn amount exceeds balance', true],
    }, function(depositSender, depositAmount, recipient, amountToWithdraw, expectedErrorMessage, mustFail) {
        it(t('user', 'withdraw', 'Should able (or not) to withdraw DAIs.', mustFail), async function() {
            // Setup
            await settingsInstance.createPlatformSetting(
                toBytes32(web3, settingsNames.MaximumTotalValueLocked),
                2000,
                0,
                2000,
                { from: accounts[0] }
            );
            const tTokenInstance = await TDAI.new(settingsInstance.address);
            const lendingTokenInstance = await Token.new();
            await tTokenInstance.addMinter(instance.address);
            await initContracts(
                settingsInstance,
                cTokenInstance,
                instance,
                tTokenInstance,
                consensusInstance,
                lendingTokenInstance,
                loansInstance,
                Lenders,
            );
            await lendingTokenInstance.approve(instance.address, depositAmount, { from: depositSender });
            await instance.deposit(depositAmount, { from: depositSender });
            
            try {
                // Invocation
                const result = await instance.withdraw(amountToWithdraw, { from: recipient });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                lendingPool
                    .tokenWithdrawn(result)
                    .emitted(recipient, amountToWithdraw);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});