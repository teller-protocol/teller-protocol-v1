// JS Libraries
const withData = require("leche").withData;
const BigNumber = require("bignumber.js");

const { t, NULL_ADDRESS, ACTIVE, CLOSED, getLatestTimestamp, ONE_HOUR, ONE_DAY } = require("../utils/consts");
const { createLoanTerms } = require("../utils/structs");
const Timer = require("../../scripts/utils/Timer");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { createLoan } = require('../utils/loans');

const ERC20InterfaceEncoder = require("../utils/encoders/ERC20InterfaceEncoder");
const ChainlinkAggregatorEncoder = require("../utils/encoders/ChainlinkAggregatorEncoder");
const LendingPoolInterfaceEncoder = require("../utils/encoders/LendingPoolInterfaceEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");

contract("EtherCollateralLoansLiquidateLoanTest", function(accounts) {
  BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: 3 });
  const timer = new Timer(web3);

  const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
  const chainlinkAggregatorEncoder = new ChainlinkAggregatorEncoder(web3);
  const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);

  let instance;
  let loanTermsConsInstance;
  let lendingPoolInstance;
  let lendingTokenInstance;
  let settingsInstance;
  let marketsInstance;
  let chainlinkAggregatorInstance;

  const mockLoanID = 2831;

  const totalCollateral = BigNumber("8000000000000000000"); // 8 ETH
  const loanBorrower = accounts[3];
  const liquidator = accounts[4];

  beforeEach("Setup for each test", async () => {
    settingsInstance = await createTestSettingsInstance(Settings, {
      Mock,
      initialize: true,
      onInitialize: (instance, { chainlinkAggregator }) => {
        chainlinkAggregatorInstance = chainlinkAggregator
      }
    });

    lendingPoolInstance = await Mock.new();
    lendingTokenInstance = await Mock.new();
    loanTermsConsInstance = await Mock.new();
    marketsInstance = await Mock.new();
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
    _1_loan_expired: [ 1900000000, 32725581, "6000000000000000000", 6512, true, 30, BigNumber("6000000000000000000"), 6, false, undefined ],
    _2_under_collateralized: [ 1900000000, 32725581, "5942423100000000000", 6512, false, 30, BigNumber("6000000000000000000"), 6, false, undefined ],
    _3_collateral_ratio_zero: [ 1900000000, 32725581, "0", 0, false, 30, BigNumber("6000000000000000000"), 6, true, "DOESNT_NEED_LIQUIDATION" ],
    _4_collateral_ratio_gt_zero_good_standing: [ 1900000000, 32725581, "6000000000000000000", 6512, false, 30, BigNumber("6000000000000000000"), 6, true, "DOESNT_NEED_LIQUIDATION" ]
  }, function(
    loanPrincipalOwed,
    loanInterestOwed,
    loanCollateral,
    loanCollateralRatio,
    expired,
    loanDurationInDays,
    oracleValue,
    tokenDecimals,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("user", "liquidate", "Should able to (or not) liquidate a loan.", mustFail), async function() {
      // encode current token price
      await chainlinkAggregatorInstance.givenMethodReturnUint(
        chainlinkAggregatorEncoder.encodeValueFor(),
        oracleValue.toString()
      );

      // encode token decimals
      const encodeDecimals = erc20InterfaceEncoder.encodeDecimals();
      await lendingTokenInstance.givenMethodReturnUint(encodeDecimals, tokenDecimals);

      // set up the loan information
      const currentTimestampSeconds = await timer.getCurrentTimestampInSeconds();
      let loanLength = Math.floor(loanDurationInDays * ONE_DAY);
      const loanStartTime = currentTimestampSeconds - loanLength;
      if (!expired) {
        loanLength += ONE_HOUR;
      }

      const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, loanCollateralRatio, 0, loanLength);
      
      const loan = createLoan({ id: mockLoanID, loanTerms, loanStartTime, collateral: loanCollateral, principalOwed: loanPrincipalOwed, interestOwed: loanInterestOwed, borrowedAmount: loanTerms.maxLoanAmount, status: ACTIVE, liquidated: false});

      await instance.setLoan(loan);
      await instance.setTotalCollateral(totalCollateral);

      // give the contract collateral (mock has a fallback)
      await web3.eth.sendTransaction({ from: accounts[1], to: instance.address, value: totalCollateral });

      try {
        const contractBalBefore = await web3.eth.getBalance(instance.address);
        const liquidatorBefore = await web3.eth.getBalance(liquidator);

        const result = await instance.liquidateLoan(mockLoanID, { from: liquidator });

        assert(!mustFail, "It should have failed because data is invalid.");
        assert(result);

        const totalAfter = await instance.totalCollateral.call();
        const contractBalAfter = await web3.eth.getBalance(instance.address);
        const liquidatorAfter = await web3.eth.getBalance(liquidator);

        let loan = await instance.loans.call(mockLoanID);

        assert.equal(parseInt(loan["collateral"]), 0);
        assert.equal(totalCollateral.minus(loanCollateral).toFixed(), totalAfter.toString());
        assert.equal(BigNumber(contractBalBefore).minus(loanCollateral).toFixed(), contractBalAfter.toString());
        assert(parseInt(liquidatorBefore) < parseInt(liquidatorAfter));
        assert.equal(parseInt(loan["status"]), CLOSED);
        assert.equal(loan["liquidated"], true);

      } catch (error) {
        assert(mustFail, error.message);
        assert.equal(error.reason, expectedErrorMessage, error.message);
      }
    });
  });
});