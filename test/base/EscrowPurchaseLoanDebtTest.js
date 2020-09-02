// JS Libraries
const settingsNames = require("../utils/platformSettingsNames");
const LoansBaseInterfaceEncoder = require("../utils/encoders/LoansBaseInterfaceEncoder");
const { escrow } = require("../utils/events");
const { withData } = require("leche");
const { t } = require("../utils/consts");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");

contract("EscrowPurchaseLoanDebtTest", function(accounts) {
  const loansEncoder = new LoansBaseInterfaceEncoder(web3)

  let loans;
  let instance;
  let lendingToken;
  const borrower = accounts[0]

  beforeEach(async () => {
    loans = await Mock.new()
    instance = await Escrow.new()
    await instance.mockInitialize(loans.address, 1234, { from: borrower })

    lendingToken = await DAI.new()
    await loans.givenMethodReturnAddress(
      loansEncoder.encodeLendingToken(),
      lendingToken.address
    )
  });

  withData({
    _1_success: [ accounts[3], true, 1000, 1000, false, null ],
  }, function(
    caller,
    canPurchase,
    allowanceAmount,
    totalOwedAmount,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("escrow", "purchaseLoanDebt", "Should be able to (or not) purchase the Escrow's loan debt.", mustFail), async function() {
      // Setup
      await loans.givenMethodReturnBool(
        loansEncoder.encodeCanLiquidateLoan(),
        canPurchase
      )
      await loans.givenMethodReturnUint(
        loansEncoder.encodeGetTotalOwed(),
        totalOwedAmount
      )
      await lendingToken.approve(instance.address, allowanceAmount)

      try {
        // Invocation
        const result = await instance.purchaseLoanDebt()

        escrow
          .ownershipTransferred(result)
          .emitted(borrower, caller)

        // Assertions
        // assert.equal(result, expectedResult, 'Incorrect result!')
      } catch (error) {
        assert.equal(error.reason, expectedErrorMessage);
        assert(mustFail);
      }
    });
  });
});
