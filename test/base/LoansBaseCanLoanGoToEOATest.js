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

// Libraries
const LoanLib = artifacts.require("../util/LoanLib.sol");

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
    const loanLib = await LoanLib.new();
    await Loans.link("LoanLib", loanLib.address); 
    instance = await Loans.new();
    await instance.externalInitialize(settings.address);
  });

  withData({
    _1_collateral_ratio_50: [ '5000', false ],
    _2_collateral_ratio_90: [ '9000', false ],
    _3_collateral_ratio_110: [ '11000', false ],
    _4_collateral_ratio_130: [ '13000', true ],
    _5_collateral_ratio_130_01: [ '13001', true ],
    _6_collateral_ratio_136: [ '13600', true ],
    _7_collateral_ratio_140: [ '14000', true ],
    _8_collateral_ratio_150: [ '15000', true ],
    _9_collateral_ratio_160: [ '16000', true ],
  }, function(
    collateralRatio,
    expectedResult
  ) {
    it(t("user", "isLoanOverCollateralized", "Should able to test whether a loan is considered to be secured.", false), async function() {
      // Setup
      const loanTerms = createLoanTerms(NULL_ADDRESS, NULL_ADDRESS, 0, collateralRatio, 0, 0);
      const loanID = 1234;
      await instance.setLoan(loanID, loanTerms, 0, 0, 0, 0, 0, 0, 0, 1, false);

      // Invocation
      const isOverCollateralized = await instance.canLoanGoToEOA.call(loanID);

      // Assertions
      assert.equal(isOverCollateralized, expectedResult, "Result does not match expected value");
    });
  });
});