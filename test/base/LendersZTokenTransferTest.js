// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const { lenders } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./mock/base/LendersMock.sol");

contract('LendersZTokenTransferTest', function (accounts) {
    let instance;
    let zTokenInstance;
    let lendingPoolInstance;
    let interestConsensusInstance;
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);

    const amountTransferred = 5
    const recipient = accounts[4]
    
    beforeEach('Setup for each test', async () => {
        zTokenInstance = await Mock.new();
        interestConsensusInstance = await Mock.new();
        lendingPoolInstance = await Mock.new();
        instance = await Lenders.new(
            zTokenInstance.address,
            lendingPoolInstance.address,
            interestConsensusInstance.address
        );
    });

    withData({
        _1_Sender0Balance_no_update_previously_requested: [accounts[0], 0, 0],
        _2_Sender0Balance_update_previously_requested: [accounts[0], 0, 234],
        _3_Sender0Balance50Balance: [accounts[0], 50, 0],
    }, function(
        sender,
        senderZTokenBalance,
        currentRequestUpdateBlock,
    ) {    
        it(t('user', 'zTokenTransfer', 'Should able to update the accrued interest after transfering zToken.', false), async function() {
            // mock sender's balance
            await zTokenInstance.givenMethodReturnUint(
              erc20InterfaceEncoder.encodeBalanceOf(),
              senderZTokenBalance
            );

            // mock lender interest request
            await instance.mockRequestUpdate(sender, currentRequestUpdateBlock)

            // Invocation
            const result = await instance.zTokenTransfer(sender, recipient, amountTransferred);
            const blockRequestedUpdate = await instance.requestedInterestUpdate.call(sender);

            if (senderZTokenBalance == 0) {
              assert.equal(blockRequestedUpdate.toNumber(), result.receipt.blockNumber);
              lenders
                  .interestUpdateRequested(result)
                  .emitted(sender, result.receipt.blockNumber);
            } else {
                assert.equal(blockRequestedUpdate.toNumber(), currentRequestUpdateBlock);
                lenders
                    .interestUpdateRequested(result)
                    .notEmitted()
            }

            if (senderZTokenBalance == 0 && currentRequestUpdateBlock != 0) {
                lenders
                    .cancelInterestUpdate(result)
                    .emitted(sender, currentRequestUpdateBlock);
            } else {
                lenders
                    .cancelInterestUpdate(result)
                    .notEmitted()
            }
        });
    });
});