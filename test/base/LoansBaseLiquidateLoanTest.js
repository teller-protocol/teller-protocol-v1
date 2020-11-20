// JS Libraries
const withData = require("leche").withData;
const BigNumber = require("bignumber.js");

const { t, NULL_ADDRESS, ACTIVE, CLOSED, getLatestTimestamp, ONE_HOUR, ONE_DAY } = require("../utils/consts");
const { createLoanTerms } = require("../utils/structs");
const Timer = require("../../scripts/utils/Timer");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { createLoan, createLiquidationInfo } = require('../utils/loans');

const ERC20InterfaceEncoder = require("../utils/encoders/ERC20InterfaceEncoder");
const LendingPoolInterfaceEncoder = require("../utils/encoders/LendingPoolInterfaceEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Loans = artifacts.require("./mock/base/LoansBaseMock.sol");

contract("LoansBaseLiquidateLoanTest", function(accounts) {
  BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: 3 });
  const timer = new Timer(web3);

  const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
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
    loansUtilInstance = await Mock.new();
    instance = await Loans.new();
    await instance.initialize(
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      loansUtilInstance.address,
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
      mustFail: false,
      expectedErrorMessage: null 
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
      liquidable: false,
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
      
      const loan = createLoan({ id: mockLoanID, loanTerms, loanStartTime, collateral: loanCollateral, principalOwed: loanPrincipalOwed, interestOwed: loanInterestOwed, borrowedAmount: loanTerms.maxLoanAmount, status: ACTIVE, liquidated: false});

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

      // Mint tokens to the liquidator to mock the lendingPool.liquidationPayment method
      const token = await DAI.new();
      await token.mint(liquidator, "8000000000000000000");

      try {
        const contractBalBefore = await web3.eth.getBalance(instance.address);
        const liquidatorBefore = await web3.eth.getBalance(liquidator);
        const liquidationInfo = await instance.getLiquidationInfo(mockLoanID);
        console.log({liquidationInfo});
        const result = await instance.liquidateLoan(mockLoanID, { from: liquidator });

        assert(!mustFail, "It should have failed because data is invalid.");
        assert(result);

        const totalAfter = await instance.totalCollateral.call();
        const contractBalAfter = await web3.eth.getBalance(instance.address);
        const liquidatorAfter = await web3.eth.getBalance(liquidator);
        console.log({contractBalBefore, contractBalAfter});

        let loan = await instance.loans.call(mockLoanID);

        assert.equal(parseInt(loan["collateral"]), 0, "Loan collateral not match");
        assert.equal(totalCollateral.minus(loanCollateral).toFixed(), totalAfter.toString(), "Total collateral not match");
        assert.equal(BigNumber(contractBalBefore).minus(loanCollateral).toFixed(), contractBalAfter.toString(), "Contract balance not match");
        // assert(parseInt(liquidatorBefore) < parseInt(liquidatorAfter), "Liquidator balance not increased");
        assert.equal(parseInt(loan["status"]), CLOSED, "Loan not closed");
        assert.equal(loan["liquidated"], true, "Loan not liquidated");

      } catch (error) {
        assert(mustFail, error.message);
        assert.equal(error.reason, expectedErrorMessage, error.message);
      }
    });
  });
});