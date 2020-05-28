// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { lendingPool } = require('../utils/events');
const { initContracts } = require('../utils/contracts');
const BurnableInterfaceEncoder = require('../utils/encoders/BurnableInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const Token = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Lenders = artifacts.require("./base/Lenders.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");
const ZDai = artifacts.require("./base/ZDAI.sol");

contract('LendingPoolWithdrawTest', function (accounts) {
    const burnableInterfaceEncoder = new BurnableInterfaceEncoder(web3);
    let instance;
    let zTokenInstance;
    let lendingTokenInstance;
    let loansInstance;
    let consensusInstance;
    let cTokenInstance;
    let settingsInstance;
    
    beforeEach('Setup for each test', async () => {
        loansInstance = await Mock.new();
        consensusInstance = await Mock.new();
        settingsInstance = await Mock.new();
        cTokenInstance = await Mock.new()
        instance = await LendingPool.new();
    });

    withData({
        _1_basic: [accounts[0], true, 10, undefined, false],
        _2_transferFail: [accounts[1], false, 50, 'Transfer was not successful.', true],
    }, function(recipient, transfer, amountToWithdraw, expectedErrorMessage, mustFail) {
        it(t('user', 'withdraw', 'Should able (or not) to withdraw DAIs.', mustFail), async function() {
            // Setup
            zTokenInstance = await Mock.new();
            lendingTokenInstance = await Mock.new();
            await initContracts(settingsInstance, cTokenInstance, instance, zTokenInstance, consensusInstance, lendingTokenInstance, loansInstance, Lenders);
            const encodeTransfer = burnableInterfaceEncoder.encodeTransfer();
            await lendingTokenInstance.givenMethodReturnBool(encodeTransfer, transfer);

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
        _2_recipientNotEnoughZDaiBalance: [accounts[0], 99, accounts[0], 100, 'ERC20: burn amount exceeds balance', true],
        _3_recipientNotZDaiBalance: [accounts[0], 100, accounts[1], 10, 'ERC20: burn amount exceeds balance', true],
    }, function(depositSender, depositAmount, recipient, amountToWithdraw, expectedErrorMessage, mustFail) {
        it(t('user', 'withdraw', 'Should able (or not) to withdraw DAIs.', mustFail), async function() {
            // Setup
            zTokenInstance = await ZDai.new();
            lendingTokenInstance = await Token.new();
            await zTokenInstance.addMinter(instance.address);
            await initContracts(settingsInstance, cTokenInstance, instance, zTokenInstance, consensusInstance, lendingTokenInstance, loansInstance, Lenders);
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