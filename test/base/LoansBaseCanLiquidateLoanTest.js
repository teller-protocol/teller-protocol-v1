// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS } = require("../utils/consts");
const SettingsInterfaceEncoder = require("../utils/encoders/SettingsInterfaceEncoder");
const EscrowInterfaceEncoder = require("../utils/encoders/EscrowInterfaceEncoder");
const Timer = require("../../scripts/utils/Timer");
const { TERMS_SET } = require("../utils/consts");
const { ACTIVE } = require("../utils/consts");
const { ONE_HOUR } = require("../utils/consts");
const { ONE_DAY } = require("../utils/consts");
const { getLatestTimestamp } = require("../utils/consts");
const { createLoanTerms } = require("../utils/structs");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/LoansBaseMock.sol");

contract("LoansBaseCanLiquidateLoanTest", function(accounts) {
  const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
  const escrowInterfaceEncoder = new EscrowInterfaceEncoder(web3);
  const timer = new Timer(web3)

  let settings;
  let instance;
  const mockLoanID = 1234;

  beforeEach("Setup for each test", async () => {
    settings = await Mock.new();
    instance = await Loans.new();
    await instance.externalInitialize(settings.address);
  });

  withData({
    _1_platform_paused: [ true, false, ACTIVE, false, false, false, false, false ],
    _2_lending_pool_paused: [ false, true, ACTIVE, false, false, false, false, false ],
    _3_loan_not_active: [ false, false, TERMS_SET, false, false, false, false, false ],
    _4_is_expired: [ false, false, ACTIVE, true, false, false, false, false ],
    _5_has_escrow_not_under_valued: [ false, false, ACTIVE, false, true, false, false, false ],
    _6_has_escrow_is_under_valued: [ false, false, ACTIVE, false, true, true, false, true ],
    _7_more_collateral_required: [ false, false, ACTIVE, false, false, false, true, true ],
    _8_success: [ false, false, ACTIVE, false, false, false, false, false ],
  }, function(
    isPlatformPaused,
    isLendingPoolPaused,
    loanStatus,
    isExpired,
    hasEscrow,
    isEscrowUnderValued,
    moreCollateralRequired,
    expectedResult
  ) {
    it(t("user", "canLiquidateLoan", "Should able to test whether a loan can be liquidated.", false), async function() {
      // Setup
      await settings.givenMethodReturnBool(
        settingsInterfaceEncoder.encodeIsPaused(),
        isPlatformPaused
      )
      await settings.givenMethodReturnBool(
        settingsInterfaceEncoder.encodeIsPoolPaused(),
        isLendingPoolPaused
      )

      const currentTime = await getLatestTimestamp()
      const loanLength = Math.floor(300000 * ONE_DAY / 10000)
      let loanExpiry = currentTime - loanLength
      if (!isExpired) {
        loanExpiry += ONE_HOUR
      }
      const currentTimestampSeconds = await timer.getCurrentTimestampInSeconds();
      const loanStartTime = currentTimestampSeconds + 100;

      let loanTerms = createLoanTerms(accounts[3], NULL_ADDRESS, 0, 0, 0, 0)
      const collateral = 100000
      await instance.setLoan(mockLoanID, loanTerms, loanExpiry, loanStartTime, collateral, 0, 0, 0, loanTerms.maxLoanAmount, loanStatus, false)

      if (hasEscrow) {
        const escrow = await Mock.new()
        await escrow.givenMethodReturnBool(
          escrowInterfaceEncoder.encodeIsUnderValued(),
          isEscrowUnderValued
        )
        await instance.setEscrowForLoan(mockLoanID, escrow.address)
      }

      const neededInLending = 10000
      const neededInCollateral = moreCollateralRequired ? collateral + 10000 : collateral - 10000
      await instance.mockGetCollateralInfo(mockLoanID, neededInLending, neededInCollateral)

      // Invocation
      const result = await instance.canLiquidateLoan.call(mockLoanID)

      // Assertions
      assert.equal(result, expectedResult, "Result does not match expected value");
    });
  });
});