// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { lenders } = require('../utils/events');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./mock/base/LendersMock.sol");

contract('LendersUpdateAccruedInterestTest', function (accounts) {
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
        _1_sender_is_not_lender: [accounts[0], 0, 0, 'SENDER_IS_NOT_LENDER', true],
        _2_no_update_previously_requested: [accounts[1], 1, 0, undefined, false],
        _3_update_previously_requested: [accounts[2], 1, 36273, undefined, false]
    }, function(
        lenderAddress,
        currentZTokenBalance,
        currentRequestUpdateBlock,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'updateAccruedInterestFor', 'Should able to update the accrued interest.', false), async function() {
            // Setup
            await zTokenInstance.givenMethodReturnUint(
                erc20InterfaceEncoder.encodeBalanceOf(),
                currentZTokenBalance
            );
            await instance.mockRequestUpdate(lenderAddress, currentRequestUpdateBlock)

            try {
              // Invocation
              const result = await instance.updateAccruedInterest({ from: lenderAddress });

              // Assertions
              assert(result);
              assert(!mustFail, 'it should have failed');
              lenders
                  .interestUpdateRequested(result)
                  .emitted(lenderAddress, result.receipt.blockNumber);

              if (currentRequestUpdateBlock != 0) {
                  lenders
                      .cancelInterestUpdate(result)
                      .emitted(lenderAddress, currentRequestUpdateBlock);
              } else {
                lenders
                      .cancelInterestUpdate(result)
                      .notEmitted()
              }

              const blockRequestedUpdate = await instance.requestedInterestUpdate.call(lenderAddress);
              assert.equal(blockRequestedUpdate, result.receipt.blockNumber);
            } catch (error) {
              // Assertions
              assert(mustFail);
              assert.equal(error.reason, expectedErrorMessage);
          }
        });
    });
});