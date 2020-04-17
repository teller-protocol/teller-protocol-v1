// JS Libraries
const withData = require('leche').withData;
const { t, sum, createInfo } = require('../utils/consts');
const { mockLenderInfo } = require('../utils/contracts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const ZTokenToken = artifacts.require("./mock/token/SimpleToken.sol");

// Smart contracts
const Lenders = artifacts.require("./mock/base/LendersMock.sol");

contract('LendersZTokenTransferTest', function (accounts) {
    const tokensOwner = accounts[8];
    let instance;
    let zTokenInstance;
    let lendingPoolInstance;
    
    beforeEach('Setup for each test', async () => {
        zTokenInstance = await ZTokenToken.new({from: tokensOwner});
        lendingPoolInstance = await Mock.new();
        instance = await Lenders.new(
            zTokenInstance.address,
            lendingPoolInstance.address,
        );
    });

    withData({
        _1_onlyRecipient: [1, createInfo(accounts[0], 0, 0, 0), createInfo(accounts[1], 0, 0, 1), 1, 1],
        _2_both: [10, createInfo(accounts[0], 0, 0, 10), createInfo(accounts[1], 1, 0, 5), 5, 2],
    }, function(
        senderInitialAmount,
        sender,
        recipient,
        amount,
        plusBlockNumbers,
    ) {    
        it(t('user', 'zTokenTransfer', 'Should able to update the accrued interest after transfering zToken.', false), async function() {
            // Setup
            // Initial transfer to sender and, transfer sender to recipient.
            await zTokenInstance.transfer(sender.address, senderInitialAmount.toString(), { from: tokensOwner });
            await zTokenInstance.transfer(recipient.address, amount.toString(), { from: sender.address });

            // Mocking lender info (accrued interest and lastaccrued block number) and current block number.
            const currentBlockNumber = await web3.eth.getBlockNumber();
            await mockLenderInfo(instance, recipient, currentBlockNumber);
            await mockLenderInfo(instance, sender, currentBlockNumber);
            await instance.setCurrentBlockNumber(sum(currentBlockNumber, plusBlockNumbers));

            // Invocation
            const result = await instance.zTokenTransfer(sender.address, recipient.address, amount);

            // Assertions
            assert(result);
            const senderLenderAccountResult = await instance.lenderAccounts(sender.address);
            assert.equal(senderLenderAccountResult.totalAccruedInterest.toString(), sender.expectedAccruedInterest.toString());

            const recipientLenderAccountResult = await instance.lenderAccounts(recipient.address);
            assert.equal(recipientLenderAccountResult.totalAccruedInterest.toString(), recipient.expectedAccruedInterest.toString());
        });
    });
});