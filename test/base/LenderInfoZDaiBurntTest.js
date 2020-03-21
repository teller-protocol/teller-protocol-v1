// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const ZDaiToken = artifacts.require("./mock/token/SimpleToken.sol");

// Smart contracts
const LenderInfo = artifacts.require("./mock/base/LenderInfoMock.sol");

contract('LenderInfoZDaiBurntTest', function (accounts) {
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

    const mockLenderInfo = async (lenderData, currentBlockNumber) => {
        await instance.mockLenderInfo(
            lenderData.address,
            sum(currentBlockNumber, lenderData.plusLastAccruedBlockNumber),
            lenderData.lastAccruedInterest
        );
    };

    withData({
        _1_0finalBalance_0currentIntereset_1block_1burnt: [1, createInfo(1, 0, 0, 0), 1, 1],
        _2_10finalBalance_100currentInterest_1block_190burnt: [200, createInfo(2, 2, 100, 120), 190, 4],
        _3_50finalBalance_10currentInterest_0Blocks_50burnt: [100, createInfo(3, 5, 10, 10), 50, 5],
    }, function(
        initialAmount,
        recipient,
        amount,
        plusBlockNumbers,
    ) {    
        it(t('user', 'zDaiBurnt', 'Should able to update the accrued interest after burning zDai.', false), async function() {
            // Setup
            await zdaiInstance.transfer(recipient.address, initialAmount, { from: tokensOwner });
            await zdaiInstance.burn(amount, { from: recipient.address });

            // Mocking recipient info (accrued interest and lastaccrued block number) and current block number.
            const currentBlockNumber = await web3.eth.getBlockNumber();
            await mockLenderInfo(recipient, currentBlockNumber);
            await instance.setCurrentBlockNumber(sum(currentBlockNumber, plusBlockNumbers));

            // Invocation
            const result = await instance.zDaiBurnt(recipient.address, amount);

            // Assertions
            assert(result);
            const recipientLenderAccountResult = await instance.lenderAccounts(recipient.address);
            assert.equal(recipientLenderAccountResult.totalAccruedInterest.toString(), recipient.expectedAccruedInterest.toString());
        });
    });
});