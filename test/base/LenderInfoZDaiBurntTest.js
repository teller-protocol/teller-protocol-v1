// JS Libraries
const withData = require('leche').withData;
const { t, sum, createInfo } = require('../utils/consts');
const { mockLenderInfo, createInstance } = require('../utils/contracts');

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
        zdaiInstance = await createInstance(ZDaiToken.new({from: tokensOwner}));
        daiPoolInstance = await createInstance(Mock.new());
        instance = await createInstance(
            LenderInfo.new(
                zdaiInstance.address,
                daiPoolInstance.address,
            )
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
        it(t('user', 'zDaiBurnt', 'Should able to update the accrued interest after burning zDai.', false), async function() {
            // Setup
            await zdaiInstance.transfer(recipient.address, initialAmount, { from: tokensOwner });
            await zdaiInstance.burn(amount, { from: recipient.address });

            // Mocking recipient info (accrued interest and lastaccrued block number) and current block number.
            const currentBlockNumber = await web3.eth.getBlockNumber();
            await mockLenderInfo(instance, recipient, currentBlockNumber);
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