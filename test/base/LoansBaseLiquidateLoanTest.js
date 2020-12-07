// JS Libraries
const withData = require("leche").withData;
const BigNumber = require("bignumber.js");

const { t, NULL_ADDRESS, ACTIVE, LIQUIDATED, ONE_HOUR, ONE_DAY } = require("../utils/consts");
const { createLoanTerms } = require("../utils/structs");
const Timer = require("../../scripts/utils/Timer");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { createLoan, createLiquidationInfo } = require('../utils/loans');
const { loans } = require('../utils/events');

const LendingPoolInterfaceEncoder = require("../utils/encoders/LendingPoolInterfaceEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Loans = artifacts.require("./mock/base/LoansBaseMock.sol");

// Libraries
const LoanLib = artifacts.require("../util/LoanLib.sol");

contract("LoansBaseLiquidateLoanTest", function(accounts) {
  BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: 3 });
  const timer = new Timer(web3);

  const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);

  let instance;
  let loanTermsConsInstance;
  let lendingPoolInstance;
  let lendingTokenInstance;
  let settingsInstance;
  let marketsInstance;

  const mockLoanID = 2831;

  const totalCollateral = BigNumber("8000000000000000000"); // 8 ETH
  const loanBorrower = accounts[3];
  const liquidator = accounts[4];

  beforeEach("Setup for each test", async () => {
    settingsInstance = await createTestSettingsInstance(Settings, {
      Mock, 
      from: accounts[0],
      initialize: true,
    });

    lendingPoolInstance = await Mock.new();
    lendingTokenInstance = await Mock.new();
    loanTermsConsInstance = await Mock.new();
    marketsInstance = await Mock.new();
    const loanLib = await LoanLib.new();
    await Loans.link("LoanLib", loanLib.address);
    instance = await Loans.new();
    await instance.initialize(
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address,
      marketsInstance.address
    );

    // encode lending token address
    const encodeLendingToken = lendingPoolInterfaceEncoder.encodeLendingToken();
    await lendingPoolInstance.givenMethodReturnAddress(encodeLendingToken, lendingTokenInstance.address);
  });

  withData({
    _1_not_liquidable: [ {
      loanPrincipalOwed: 0,
      loanInterestOwed: 0,
      loanCollateral: 0,
      loanCollateralRatio: 0,
      expired: true,
      loanDurationInDays: 0,
      valueInLendingTokens: 0,
      escrowLoanValue: 0,
      neededInLendingTokens: 0,
      neededInCollateralTokens: 0, 
      moreCollateralRequired: false,
      amountToLiquidate: 0,
      rewardToLiquidate: 0,
      liquidable: false,
      mustFail: true,
      expectedErrorMessage: "DOESNT_NEED_LIQUIDATION" 
  }],
    _2_is_liquidable: [ {
      loanPrincipalOwed: 0,
      loanInterestOwed: 0,
      loanCollateral: 0,
      loanCollateralRatio: 0,
      expired: true,
      loanDurationInDays: 0,
      valueInLendingTokens: 0,
      escrowLoanValue: 0,
      neededInLendingTokens: 0,
      neededInCollateralTokens: 0, 
      moreCollateralRequired: false,
      amountToLiquidate: 0,
      rewardToLiquidate: 0,
      liquidable: true,
      mustFail: false,
      expectedErrorMessage: null 
  }],
  }, function({
    loanPrincipalOwed,
    loanInterestOwed,
    loanCollateral,
    loanCollateralRatio,
    expired,
    loanDurationInDays,
    valueInLendingTokens,
    escrowLoanValue,
    neededInLendingTokens,
    neededInCollateralTokens,
    moreCollateralRequired,
    amountToLiquidate,
    rewardToLiquidate,
    liquidable,
    mustFail,
    expectedErrorMessage
  }) {
    it(t("user", "liquidate", "Should able to (or not) liquidate a loan.", mustFail), async function() {

      // set up the loan information
      const currentTimestampSeconds = await timer.getCurrentTimestampInSeconds();
      let loanLength = Math.floor(loanDurationInDays * ONE_DAY);
      const loanStartTime = currentTimestampSeconds - loanLength;
      if (!expired) {
        loanLength += ONE_HOUR;
      }

      const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, loanCollateralRatio, 0, loanLength);
      
      const loan = createLoan({ id: mockLoanID, loanTerms, loanStartTime, collateral: loanCollateral, principalOwed: loanPrincipalOwed, interestOwed: loanInterestOwed, borrowedAmount: loanTerms.maxLoanAmount, status: ACTIVE });

      const mockedLiquidationInfo = createLiquidationInfo({
        collateralInfo: {
          collateral: loanCollateral,
          valueInLendingTokens,
          escrowLoanValue,
          neededInLendingTokens,
          neededInCollateralTokens,
          moreCollateralRequired
        },
        amountToLiquidate,
        rewardToLiquidate,
        liquidable,
      });

      await instance.setLoan(loan);
      await instance.mockLiquidationInfo(mockedLiquidationInfo);

      try {
        const result = await instance.liquidateLoan(mockLoanID, { from: liquidator });

        assert(!mustFail, "It should have failed because data is invalid.");
        assert(result);

        let loan = await instance.loans.call(mockLoanID);

        // - Assert loan status was changed
        // - The liquidated bool on the loan is true
        // - Event emitted 
        
        loans
            .loanLiquidated(result)
            .emitted(mockLoanID, loanBorrower, liquidator, loanCollateral, amountToLiquidate);

        assert.equal(parseInt(loan["status"]), LIQUIDATED, "Loan not liquidated");

      } catch (error) {
        assert(mustFail, error.message);
        assert.equal(error.reason, expectedErrorMessage, error.message);
      }
    });
  });
});