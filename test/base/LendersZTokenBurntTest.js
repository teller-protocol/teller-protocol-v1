// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const { lenders } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./mock/base/LendersMock.sol");

contract('LendersZTokenBurntTest', function (accounts) {
    let instance;
    let zTokenInstance;
    let lendingPoolInstance;
    let interestConsensusInstance;
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);

    beforeEach('Setup for each test', async () => {
        zTokenInstance = await Mock.new();
        lendingPoolInstance = await Mock.new();
        interestConsensusInstance = await Mock.new();
        instance = await Lenders.new(
            zTokenInstance.address,
            lendingPoolInstance.address,
            interestConsensusInstance.address
        );
    });

    withData({
        _1_0Balance_no_update_previously_requested: [accounts[0], 0, 0, 5],
        _2_0Balance_update_previously_requested: [accounts[0], 0, 234, 5],
        _3_50Balance: [accounts[0], 50, 0, 5],
    }, function(
        recipient,
        currentZTokenBalance,
        currentRequestUpdateBlock,
        amount
    ) {    
        it(t('user', 'zTokenBurnt', 'Should able to update the accrued interest after burning zToken.', false), async function() {
            // Setup
            await zTokenInstance.givenMethodReturnUint(
              erc20InterfaceEncoder.encodeBalanceOf(),
              currentZTokenBalance
            );

            await instance.mockRequestUpdate(recipient, currentRequestUpdateBlock)

            const previousBlockUpdated = await instance.requestedInterestUpdate.call(recipient);

            // Invocation
            const result = await instance.zTokenBurnt(recipient, amount);
            const blockRequestedUpdate = await instance.requestedInterestUpdate.call(recipient);

            if (currentZTokenBalance == 0) {
                assert.equal(blockRequestedUpdate.toNumber(), result.receipt.blockNumber);
                lenders
                    .interestUpdateRequested(result)
                    .emitted(recipient, result.receipt.blockNumber);
            } else {
                assert.equal(blockRequestedUpdate.toNumber(), previousBlockUpdated.toNumber());
                lenders
                    .interestUpdateRequested(result)
                    .notEmitted()
            }

            if (currentZTokenBalance == 0 && currentRequestUpdateBlock != 0) {
                lenders
                    .cancelInterestUpdate(result)
                    .emitted(recipient, currentRequestUpdateBlock);
            } else {
                lenders
                    .cancelInterestUpdate(result)
                    .notEmitted()
          }
        });
    });
});