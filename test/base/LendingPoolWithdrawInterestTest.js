// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { lendingPool } = require('../utils/events');
const BurnableInterfaceEncoder = require('../utils/encoders/BurnableInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./mock/base/LendersMock.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");

contract('LendingPoolWithdrawInterestTest', function (accounts) {
    const burnableInterfaceEncoder = new BurnableInterfaceEncoder(web3);
    let instance;
    let zTokenInstance;
    let lendingTokenInstance;
    let loansInstance;
    let consensusInstance;
    let settingsInstance;
    let cTokenInstance;
    let lendersInstance;
    
    beforeEach('Setup for each test', async () => {
        loansInstance = await Mock.new();
        consensusInstance = await Mock.new();
        settingsInstance = await Mock.new();
        zTokenInstance = await Mock.new();
        lendingTokenInstance = await Mock.new();
        cTokenInstance = await Mock.new()
        lendersInstance = await Lenders.new();
        
        instance = await LendingPool.new();
        await lendersInstance.initialize(
            zTokenInstance.address,
            instance.address,
            consensusInstance.address,
            settingsInstance.address,
        );
        await instance.initialize(
            zTokenInstance.address,
            lendingTokenInstance.address,
            lendersInstance.address,
            loansInstance.address,
            cTokenInstance.address,
            settingsInstance.address,
        );
    });

    withData({
        _1_basic: [accounts[0], true, 10, 10, 10, undefined, false],
        _2_basic: [accounts[0], true, 40, 30, 25, undefined, false],
        _3_basic: [accounts[0], true, 40, 25, 30, undefined, false],
        _4_transferFail: [accounts[1], false, 50, 50, 50, 'Transfer was not successful.', true],
        _5_notEnoughBalance: [accounts[1], true, 49, 50, 50, 'NOT_ENOUGH_LENDING_TOKEN_BALANCE', true],
    }, function(lender, transfer, currentBalanceOf, amountToWithdraw, totalNotWithdrawn, expectedErrorMessage, mustFail) {
        it(t('user', 'withdrawInterest', 'Should able (or not) to withdraw the interest.', mustFail), async function() {
            // Setup
            await lendersInstance.mockLenderInfo(
                lender,
                Math.floor(Date.now() / 1000),
                totalNotWithdrawn,
                totalNotWithdrawn
            );
            
            const encodeTransfer = burnableInterfaceEncoder.encodeTransfer();
            await lendingTokenInstance.givenMethodReturnBool(encodeTransfer, transfer);
            const encodeBalanceOf = burnableInterfaceEncoder.encodeBalanceOf();
            await lendingTokenInstance.givenMethodReturnUint(encodeBalanceOf, currentBalanceOf.toString());

            try {
                // Invocation
                const result = await instance.withdrawInterest(amountToWithdraw, { from: lender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                const interestWithdrawn = totalNotWithdrawn > amountToWithdraw ? amountToWithdraw : totalNotWithdrawn;
                lendingPool
                    .interestWithdrawn(result)
                    .emitted(lender, interestWithdrawn);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});