// JS Libraries
const LoansBaseInterfaceEncoder = require("../utils/encoders/LoansBaseInterfaceEncoder");
const { escrow } = require("../utils/events");
const { withData } = require("leche");
const { t } = require("../utils/consts");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");

contract("EscrowRepayTest", function(accounts) {
  const loansEncoder = new LoansBaseInterfaceEncoder(web3);

  let dai;
  let loans;
  let instance;

  beforeEach(async () => {
    dai = await DAI.new();

    loans = await Mock.new();
    await loans.givenMethodReturnAddress(
      loansEncoder.encodeLendingToken(),
      dai.address
    );

    instance = await Escrow.new();
    await instance.mockLoans(loans.address);
  });

  withData({
    _1_only_owner: [ false, 0, 0, 0, true, true, "Ownable: caller is not the owner" ],
    _2_with_escrow_balance: [ true, 1000, 1000, 0, true, false, null ],
    _3_with_user_balance: [ true, 1000, 0, 1000, true, false, null ],
    _4_with_partial_escrow_balance: [ true, 1000, 800, 200, true, false, null ],
    _5_with_partial_escrow_balance_user_no_funds: [ true, 1000, 800, 0, true, true, "ERC20: transfer amount exceeds balance" ],
    _6_transfer_from_false: [ true, 1000, 800, 0, false, true, "ESCROW_TRANSFER_FROM_FAILED" ],
  }, function(
    isOwner,
    amount,
    escrowBalance,
    userBalance,
    transferFromBool,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("user", "repay", "Should be able to make a payment on the Escrow's loan.", mustFail), async function() {
      // Setup
      const caller = accounts[1];
      await instance.mockIsOwner(true, isOwner);

      await loans.givenMethodReturn(loansEncoder.encodeRepay(), "0x");

      await dai.mint(instance.address, escrowBalance);
      await dai.mint(caller, userBalance);
      await dai.approve(instance.address, escrowBalance - userBalance, { from: caller });
      if (!transferFromBool) {
        await dai.mockTransferFromReturnFalse();
      }

      try {
        // Invocation
        await instance.repay(amount, { from: caller });

        const loansRepayCallCount = await loans.invocationCountForMethod.call(loansEncoder.encodeRepay());

        // Assertions
        assert.equal(loansRepayCallCount.toString(), "1", "Loans.repay was not called.");
        assert(!mustFail);
      } catch (error) {
        assert(mustFail, error.message);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
