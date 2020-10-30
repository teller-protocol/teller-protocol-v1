// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS } = require("../utils/consts");
const settingsNames = require("../utils/platformSettingsNames");
const { createLoanTerms } = require("../utils/structs");
const { createTestSettingsInstance } = require("../utils/settings-helper");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/LoansBaseMock.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract("LoansBaseCanLoanGoToEOATest", function(accounts) {
  let instance;

  const settingsOverCollateralizedBuffer = 11000;
  const settingsCollateralBuffer = 1500;
  const settingsLiquidateEthPrice = 9500;

  beforeEach("Setup for each test", async () => {
    const settings = await createTestSettingsInstance(Settings, { from: accounts[0], Mock }, {
      [settingsNames.OverCollateralizedBuffer]: settingsOverCollateralizedBuffer,
      [settingsNames.CollateralBuffer]: settingsCollateralBuffer,
      [settingsNames.LiquidateEthPrice]: settingsLiquidateEthPrice,
    });

    instance = await Loans.new();
    await instance.externalInitialize(settings.address);
  });

  withData({
    _1_collateral_ratio_50_interest_rate_687: [ '5000', '687', false ],
    _2_collateral_ratio_90_interest_rate_687: [ '9000', '687', false ],
    _3_collateral_ratio_110_interest_rate_687: [ '11000', '687', false ],
    _4_collateral_ratio_130_interest_rate_687: [ '13000', '687', false ],
    _4_collateral_ratio_136_interest_rate_587: [ '13600', '587', true ],
    _5_collateral_ratio_140_interest_rate_487: [ '14000', '487', true ],
    _6_collateral_ratio_150_interest_rate_487: [ '15000', '487', true ],
    _7_collateral_ratio_160_interest_rate_487: [ '16000', '487', true ],
  }, function(
    collateralRatio,
    interestRate,
    expectedResult
  ) {
    it(t("user", "isLoanOverCollateralized", "Should able to test whether a loan is considered to be secured.", false), async function() {
      // Setup
      const loanTerms = createLoanTerms(NULL_ADDRESS, NULL_ADDRESS, interestRate, collateralRatio, 0, 0);
      const loanID = 1234;
      await instance.setLoan(loanID, loanTerms, 0, 0, 0, 0, 0, 0, 0, 1, false);

      // Invocation
      const isOverCollateralized = await instance.canLoanGoToEOA.call(loanID);

      // Assertions
      assert.equal(isOverCollateralized, expectedResult, "Result does not match expected value");
    });
  });
});