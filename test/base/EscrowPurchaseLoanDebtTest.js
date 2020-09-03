// JS Libraries
const LoansBaseInterfaceEncoder = require("../utils/encoders/LoansBaseInterfaceEncoder");
const { escrow } = require("../utils/events");
const { withData } = require("leche");
const { t } = require("../utils/consts");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");

contract("EscrowPurchaseLoanDebtTest", function(accounts) {
  const loansEncoder = new LoansBaseInterfaceEncoder(web3);

  let loans;
  let instance;
  const borrower = accounts[0];

  beforeEach(async () => {
    loans = await Mock.new();
    instance = await Escrow.new();
    await instance.mockInitialize(loans.address, 1234, { from: borrower });
  });

  withData({
    _1_success: [ accounts[3], true, true, false, null ],
    _2_can_not_purchase: [ accounts[3], false, false, true, "ESCROW_INELIGIBLE_TO_PURCHASE" ],
    _3_repay_unsuccessful: [ accounts[3], true, false, true, "LOAN_REPAY_UNSUCCESSFUL" ],
  }, function(
    caller,
    canPurchase,
    repaySuccessful,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("escrow", "purchaseLoanDebt", "Should be able to (or not) purchase the Escrow's loan debt.", mustFail), async function() {
      // Setup
      await loans.givenMethodReturnBool(loansEncoder.encodeCanLiquidateLoan(), canPurchase);
      await loans.givenMethodReturnUint(loansEncoder.encodeGetTotalOwed(), 1000);
      if (repaySuccessful) {
        await loans.givenMethodReturn(loansEncoder.encodeRepay(), '0x');
      } else {
        await loans.givenMethodRevertWithMessage(loansEncoder.encodeRepay(), expectedErrorMessage);
      }

      try {
        // Invocation
        const result = await instance.purchaseLoanDebt({ from: caller });

        // Assertions
        escrow
          .ownershipTransferred(result)
          .emitted(borrower, caller);

        assert(!mustFail);
      } catch (error) {
        assert.equal(error.reason, expectedErrorMessage);
        assert(mustFail);
      }
    });
  });
});
