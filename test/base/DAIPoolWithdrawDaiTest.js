// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { daiPool } = require('../utils/events');
const { initContracts } = require('../utils/contracts');
const BurnableInterfaceEncoder = require('../utils/encoders/BurnableInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DAI = artifacts.require("./mock/token/SimpleToken.sol");

// Smart contracts
const LenderInfo = artifacts.require("./base/LenderInfo.sol");
const DAIPool = artifacts.require("./base/DAIPool.sol");
const ZDai = artifacts.require("./base/ZDai.sol");

contract('DAIPoolWithdrawDaiTest', function (accounts) {
    const burnableInterfaceEncoder = new BurnableInterfaceEncoder(web3);
    let instance;
    let zdaiInstance;
    let daiInstance;
    let loansInstance;
    
    beforeEach('Setup for each test', async () => {
        loansInstance = await Mock.new();
        instance = await DAIPool.new();
    });

    withData({
        _1_basic: [accounts[0], true, 10, undefined, false],
        _2_transferFail: [accounts[1], false, 50, 'Transfer was not successful.', true],
    }, function(recipient, transfer, amountToWithdraw, expectedErrorMessage, mustFail) {
        it(t('user', 'withdrawDai', 'Should able (or not) to withdraw DAIs.', mustFail), async function() {
            // Setup
            zdaiInstance = await Mock.new();
            daiInstance = await Mock.new();
            await initContracts(instance, zdaiInstance, daiInstance, loansInstance, LenderInfo);
            const encodeTransfer = burnableInterfaceEncoder.encodeTransfer();
            await daiInstance.givenMethodReturnBool(encodeTransfer, transfer);

            try {
                // Invocation
                const result = await instance.withdrawDai(amountToWithdraw, { from: recipient });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                daiPool
                    .daiWithdrawn(result)
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
        it(t('user', 'withdrawDai', 'Should able (or not) to withdraw DAIs.', mustFail), async function() {
            // Setup
            zdaiInstance = await ZDai.new();
            daiInstance = await DAI.new();
            await zdaiInstance.addMinter(instance.address);
            await initContracts(instance, zdaiInstance, daiInstance, loansInstance, LenderInfo);
            await daiInstance.approve(instance.address, depositAmount, { from: depositSender });
            await instance.depositDai(depositAmount, { from: depositSender });
            
            try {
                // Invocation
                const result = await instance.withdrawDai(amountToWithdraw, { from: recipient });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                daiPool
                    .daiWithdrawn(result)
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