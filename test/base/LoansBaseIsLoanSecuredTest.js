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

contract("LoansBaseIsLoanSecuredTest", function(accounts) {
  let instance;

  const settingsCollateralBuffer = 1000;

  beforeEach("Setup for each test", async () => {
    const settings = await createTestSettingsInstance(Settings, { from: accounts[0], Mock }, {
      [settingsNames.CollateralBuffer]: settingsCollateralBuffer
    });

    instance = await Loans.new();
    await instance.externalInitialize(settings.address);
  });

  withData({
    _1_collateral_ratio_same_as_settings_buffer: [ settingsCollateralBuffer, true ],
    _2_collateral_ratio_gt_settings_buffer: [ settingsCollateralBuffer + settingsCollateralBuffer, true ],
    _3_collateral_ratio_lt_settings_buffer: [ settingsCollateralBuffer - 100, false ],
    _3_collateral_ratio_0: [ 0, false ]
  }, function(
    collateralRatio,
    expectedResult
  ) {
    it(t("user", "isLoanSecured", "Should able to test whether a loan is considered to be secured.", false), async function() {
      // Setup
      const loanTerms = createLoanTerms(NULL_ADDRESS, NULL_ADDRESS, 0, collateralRatio, 0, 0);
      const loanID = 1234;
      await instance.setLoan(loanID, loanTerms, 0, 0, 0, 0, 0, 0, 0, 1, false);

      // Invocation
      const isSecured = await instance.isLoanSecured.call(loanID);

      // Assertions
      assert.equal(isSecured, expectedResult, "Result does not match expected value");
    });
  });
});