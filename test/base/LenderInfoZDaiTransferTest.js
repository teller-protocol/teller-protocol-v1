// JS Libraries
const withData = require('leche').withData;
const { t, sum, createInfo } = require('../utils/consts');
const { mockLenderInfo } = require('../utils/contracts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const ZDaiToken = artifacts.require("./mock/token/SimpleToken.sol");

// Smart contracts
const LenderInfo = artifacts.require("./mock/base/LenderInfoMock.sol");

contract('LenderInfoZDaiTransferTest', function (accounts) {
    const tokensOwner = accounts[8];
    let instance;
    let zdaiInstance;
    let daiPoolInstance;
    
    beforeEach('Setup for each test', async () => {
        zdaiInstance = await ZDaiToken.new({from: tokensOwner});
        daiPoolInstance = await Mock.new();
        instance = await LenderInfo.new(
            zdaiInstance.address,
            daiPoolInstance.address,
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
        it(t('user', 'zDaiTransfer', 'Should able to update the accrued interest after transfering zDai.', false), async function() {
            // Setup
            // Initial transfer to sender and, transfer sender to recipient.
            await zdaiInstance.transfer(sender.address, senderInitialAmount.toString(), { from: tokensOwner });
            await zdaiInstance.transfer(recipient.address, amount.toString(), { from: sender.address });

            // Mocking lender info (accrued interest and lastaccrued block number) and current block number.
            const currentBlockNumber = await web3.eth.getBlockNumber();
            await mockLenderInfo(instance, recipient, currentBlockNumber);
            await mockLenderInfo(instance, sender, currentBlockNumber);
            await instance.setCurrentBlockNumber(sum(currentBlockNumber, plusBlockNumbers));

            // Invocation
            const result = await instance.zDaiTransfer(sender.address, recipient.address, amount);

            // Assertions
            assert(result);
            const senderLenderAccountResult = await instance.lenderAccounts(sender.address);
            assert.equal(senderLenderAccountResult.totalAccruedInterest.toString(), sender.expectedAccruedInterest.toString());

            const recipientLenderAccountResult = await instance.lenderAccounts(recipient.address);
            assert.equal(recipientLenderAccountResult.totalAccruedInterest.toString(), recipient.expectedAccruedInterest.toString());
        });
    });
});