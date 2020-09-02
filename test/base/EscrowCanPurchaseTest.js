// JS Libraries
const LoansBaseInterfaceEncoder = require("../utils/encoders/LoansBaseInterfaceEncoder");
const { t } = require("../utils/consts");
const { withData } = require("leche");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");

contract("EscrowCanPurchaseTest", function(accounts) {
  const loansEncoder = new LoansBaseInterfaceEncoder(web3)

  let loans;
  let instance;

  beforeEach(async () => {
    loans = await Mock.new()
    instance = await Escrow.new()
    await instance.mockLoans(loans.address)
  });

  withData({
    _1_can_liquidate: [ true ],
    _2_can_not_liquidate: [ false ]
  }, function(canLiquidate) {
    it(t("escrow", "canPurchase", "Should return a bool indicating if an Escrow's loan debt can be purchased.", false), async function() {
      // Setup
      await loans.givenMethodReturnBool(loansEncoder.encodeCanLiquidateLoan(), canLiquidate)

      // Invocation
      const result = await instance.canPurchase.call()

      // Assertions
      assert.equal(result, canLiquidate, 'Incorrect result!')
    });
  });
});
