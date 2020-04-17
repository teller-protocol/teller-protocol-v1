// JS Libraries
const withData = require('leche').withData;
const { t, sum, createInfo } = require('../utils/consts');
const { mockLenderInfo } = require('../utils/contracts');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const ZTokenToken = artifacts.require("./mock/token/SimpleToken.sol");

// Smart contracts
const Lenders = artifacts.require("./mock/base/LendersMock.sol");

contract('LendersZTokenBurntTest', function (accounts) {
    const tokensOwner = accounts[8];
    let instance;
    let zTokenInstance;
    let lendingPoolInstance;
    let interestConsensusInstance;
    
    beforeEach('Setup for each test', async () => {
        zTokenInstance = await ZTokenToken.new({from: tokensOwner});
        lendingPoolInstance = await Mock.new();
        interestConsensusInstance = await Mock.new();
        instance = await Lenders.new(
            zTokenInstance.address,
            lendingPoolInstance.address,
            interestConsensusInstance.address
        );
    });

    withData({
        _1_0finalBalance_0currentIntereset_1block_1burnt: [1, createInfo(accounts[0], 0, 0, 0), 1, 1],
        _2_10finalBalance_100currentInterest_1block_190burnt: [200, createInfo(accounts[2], 2, 100, 120), 190, 4],
        _3_50finalBalance_10currentInterest_0Blocks_50burnt: [100, createInfo(accounts[3], 5, 10, 10), 50, 5],
    }, function(
        initialAmount,
        recipient,
        amount,
        plusBlockNumbers,
    ) {    
        it(t('user', 'zTokenBurnt', 'Should able to update the accrued interest after burning zToken.', false), async function() {
            // Setup
            await zTokenInstance.transfer(recipient.address, initialAmount, { from: tokensOwner });
            await zTokenInstance.burn(amount, { from: recipient.address });

            // Mocking recipient info (accrued interest and lastaccrued block number) and current block number.
            const currentBlockNumber = await web3.eth.getBlockNumber();
            await mockLenderInfo(instance, recipient, currentBlockNumber);
            await instance.setCurrentBlockNumber(sum(currentBlockNumber, plusBlockNumbers));

            // Invocation
            const result = await instance.zTokenBurnt(recipient.address, amount);

            // Assertions
            assert(result);
            const recipientLenderAccountResult = await instance.lenderAccounts(recipient.address);
            assert.equal(recipientLenderAccountResult.totalAccruedInterest.toString(), recipient.expectedAccruedInterest.toString());
        });
    });
});