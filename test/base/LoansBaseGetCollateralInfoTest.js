// JS Libraries
const withData = require("leche").withData;
const BigNumber = require("bignumber.js");
const { t, NULL_ADDRESS, ACTIVE, TERMS_SET } = require("../utils/consts");
const { createLoanTerms } = require("../utils/structs");
const { createTestSettingsInstance } = require('../utils/settings-helper');
const { createLoan } = require('../utils/loans')
const ChainlinkAggregatorEncoder = require("../utils/encoders/ChainlinkAggregatorEncoder");
const LendingPoolInterfaceEncoder = require("../utils/encoders/LendingPoolInterfaceEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LoansBase = artifacts.require("./mock/base/LoansBaseMock.sol");
const Settings = artifacts.require("./mock/base/Settings.sol");

contract("LoansBaseGetCollateralInfoTest", function(accounts) {
  BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: 3 });
  const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);
  const chainlinkAggregatorEncoder = new ChainlinkAggregatorEncoder(web3);

  let instance;
  let aggregatorInstance;
  let lendingPoolInstance;

  beforeEach("Setup for each test", async () => {
    lendingPoolInstance = await Mock.new();
    const lendingTokenInstance = await Mock.new();
    await lendingPoolInstance.givenMethodReturnAddress(
      lendingPoolInterfaceEncoder.encodeLendingToken(),
      lendingTokenInstance.address
    );

    const loanTermsConsInstance = await Mock.new();

    const settingsInstance = await createTestSettingsInstance(Settings,
      {
        Mock,
        initialize: true,
        onInitialize: async (instance, { chainlinkAggregator, }) => {
          aggregatorInstance = chainlinkAggregator;
        }
      }
    );

    instance = await LoansBase.new();
    const collateralToken = await Mock.new();
    await instance.initialize(
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address,
      collateralToken.address
    );
  });

  withData({
    _1_loan_active_collateral_gt_needed: [ ACTIVE, 10000, 100, 40000, 5000, 30000, false ],
    _2_loan_active_collateral_lt_needed: [ ACTIVE, 10000, 100, 40000, 5000, 60000, true ],
    _3_loan_terms_set_collateral_gt_needed: [ TERMS_SET, 10000, 0, 40000, 5000, 30000, false ],
    _4_loan_terms_set_collateral_lt_needed: [ TERMS_SET, 10000, 0, 40000, 5000, 60000, true ],
  }, function(
    status,
    loanAmount,
    interestOwed,
    collateralAmount,
    collateralRatio,
    oracleValue,
    expectedMoreCollateralRequired
  ) {
    it(t("user", "getCollateralInfo", "Should able to get collateral info from a loan.", false), async function() {
      // Setup
      await aggregatorInstance.givenMethodReturnUint(
        chainlinkAggregatorEncoder.encodeValueFor(),
        oracleValue.toString()
      );

      const loanID = 1
      const loanTerms = createLoanTerms(accounts[2], NULL_ADDRESS, 0, collateralRatio, loanAmount, 0);
      const loan = createLoan({
        id: loanID,
        loanTerms,
        collateral: collateralAmount,
        principalOwed: loanAmount,
        interestOwed,
        status,
      });
      await instance.setLoan(loan);

      // Invocation
      const {
        collateral: collateralResult,
        neededInLendingTokens: neededInLendingTokensResult,
        neededInCollateralTokens: neededInCollateralTokensResult,
        moreCollateralRequired: moreCollateralRequiredResult
      } = await instance.getCollateralInfo(loanID);

      loanAmount = new BigNumber(loanAmount)
      if (status === ACTIVE) {
        loanAmount = loanAmount.plus(interestOwed)
      }
      const neededInLendingTokensExpected = loanAmount.multipliedBy(collateralRatio).div(10000)

      // Assertions
      assert.equal(collateralResult.toString(), collateralAmount.toString())
      assert.equal(neededInCollateralTokensResult.toString(), oracleValue.toString());
      assert.equal(neededInLendingTokensResult.toString(), neededInLendingTokensExpected.toString());
      assert.equal(moreCollateralRequiredResult, expectedMoreCollateralRequired);
    });
  });
});