// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');

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
        assert(zdaiInstance);
        assert(zdaiInstance.address);

        daiPoolInstance = await Mock.new();
        assert(daiPoolInstance);
        assert(daiPoolInstance.address);

        instance = await LenderInfo.new(
            zdaiInstance.address,
            daiPoolInstance.address,
        );
        assert(instance);
        assert(instance.address);
    });

    const createInfo = (addressIndex, plusLastAccruedBlockNumber, lastAccruedInterest, expectedAccruedInterest) => ({
            address: accounts[addressIndex],
            plusLastAccruedBlockNumber,
            lastAccruedInterest,
            expectedAccruedInterest,
    });
    const sum = (a, b) => parseInt(a.toString()) + parseInt(b.toString());
    // TODO Extract common functions
    const mockLenderInfo = async (lenderData, currentBlockNumber) => {
        await instance.mockLenderInfo(
            lenderData.address,
            sum(currentBlockNumber, lenderData.plusLastAccruedBlockNumber),
            lenderData.lastAccruedInterest
        );
    };

    withData({
        _1_onlyRecipient: [1, createInfo(0, 0, 0, 0), createInfo(1, 0, 0, 1), 1, 1],
        _2_both: [10, createInfo(0, 0, 0, 10), createInfo(1, 1, 0, 5), 5, 2],
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
            await mockLenderInfo(recipient, currentBlockNumber);
            await mockLenderInfo(sender, currentBlockNumber);
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