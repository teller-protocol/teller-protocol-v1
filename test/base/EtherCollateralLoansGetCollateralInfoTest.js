// JS Libraries
const withData = require("leche").withData;
const BigNumber = require("bignumber.js");

const { t, ETH_ADDRESS, NULL_ADDRESS, ACTIVE, TERMS_SET, CLOSED, NON_EXISTENT, LIQUIDATED } = require("../utils/consts");
const { createLoanTerms } = require("../utils/structs");
const { createTestSettingsInstance } = require('../utils/settings-helper');
const { createLoan } = require('../utils/loans')
const platformSettings = require("../utils/platformSettingsNames")
const ChainlinkAggregatorEncoder = require("../utils/encoders/ChainlinkAggregatorEncoder");
const LendingPoolInterfaceEncoder = require("../utils/encoders/LendingPoolInterfaceEncoder");
const EscrowInterfaceEncoder = require("../utils/encoders/EscrowInterfaceEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const LoansBase = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");
const Settings = artifacts.require("./mock/base/Settings.sol");
const ChainlinkAggregator = artifacts.require("./providers/chainlink/ChainlinkAggregator");

// Libraries
const LoanLib = artifacts.require("../util/LoanLib.sol");

contract("EtherCollateralLoansGetCollateralInfoTest", function(accounts) {
  BigNumber.set({ DECIMAL_PLACES: 0, ROUNDING_MODE: 3 });
  const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);
  const chainlinkAggregatorEncoder = new ChainlinkAggregatorEncoder(web3);
  const escrowEncoder = new EscrowInterfaceEncoder(web3);

  let instance;
  let aggregatorInstance;
  let lendingPoolInstance;
  let lendingToken;
  const collateralBuffer = 1500;
  const liquidatePrice = 9500;

  beforeEach("Setup for each test", async () => {
    lendingPoolInstance = await Mock.new();
    lendingToken = await Mock.new();
    await lendingPoolInstance.givenMethodReturnAddress(
      lendingPoolInterfaceEncoder.encodeLendingToken(),
      lendingToken.address
    );

    const loanTermsConsInstance = await Mock.new();

    const settingsInstance = await createTestSettingsInstance(Settings,
      {
        from: accounts[0],
        Mock,
        initialize: true,
        onInitialize: async (instance, { chainlinkAggregator, }) => {
          aggregatorInstance = chainlinkAggregator;
        }
      }, {
        [platformSettings.CollateralBuffer]: collateralBuffer,
        [platformSettings.LiquidateEthPrice]: liquidatePrice
      }
    );
    const loanLib = await LoanLib.new();
    await LoansBase.link("LoanLib", loanLib.address);
    instance = await LoansBase.new();
    await instance.initialize(
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address,
      NULL_ADDRESS
    );
  });

  withData({
    _1_non_existent: [ NON_EXISTENT, 0, 0, 0, 0, 0, 0, false ],
    _2_closed: [ CLOSED, 10000, 100, 0, 7000, 7000, 5000, false ],
    _3_terms_set_with_more_collateral_required: [ TERMS_SET, 10000, 100, 0, 6000, 7000, 5000, true ],
    _4_terms_set_with_expected_collateral: [ TERMS_SET, 10000, 100, 0, 7000, 7000, 5000, false ],
    _5_terms_set_with_extra_collateral: [ TERMS_SET, 10000, 100, 0, 8000, 7000, 5000, false ],
    _6_active_with_escrow_with_more_collateral_required: [ ACTIVE, 10000, 100, 5000, 6000, 7000, 5000, true ],
    _7_active_with_escrow_with_expected_collateral: [ ACTIVE, 10000, 100, 10000, 7000, 7000, 5000, false ],
    _8_active_with_escrow_with_extra_collateral: [ ACTIVE, 10000, 100, 10000, 8000, 7000, 5000, false ],
    _9_active_with_no_escrow_with_more_collateral_required: [ ACTIVE, 10000, 100, 0, 6000, 7000, 5000, true ],
    _10_active_with_no_escrow_with_expected_collateral: [ ACTIVE, 10000, 100, 0, 7000, 7000, 5000, false ],
    _11_active_with_no_escrow_with_extra_collateral: [ ACTIVE, 10000, 100, 0, 8000, 7000, 5000, false ],
    _12_active_with_escrow_value_low: [ ACTIVE, 10000, 100, 1000, 6000, 7000, 5000, true ],
    _13_liquidated: [ LIQUIDATED, 10000, 100, 0, 7000, 7000, 5000, false ],
  }, function(
    status,
    loanAmount,
    interestRate,
    escrowValue,
    collateralAmount,
    neededInCollateral,
    collateralRatio,
    expectedMoreCollateralRequired
  ) {
    it(t("user", "getCollateralInfo", "Should able to get collateral info from a loan.", false), async function() {
      // Setup
      const loanID = 1;
      const loanTerms = createLoanTerms(accounts[2], NULL_ADDRESS, interestRate, collateralRatio, loanAmount, 0);
      const interestOwed = new BigNumber(loanAmount).multipliedBy(interestRate).div(10000).toString();
      const loan = createLoan({
        id: loanID,
        loanTerms,
        collateral: collateralAmount,
        principalOwed: loanAmount,
        interestOwed,
        status,
      });
      await instance.setLoan(loan);

      let escrow
      if (escrowValue > 0) {
        escrow = await Mock.new();
        await escrow.givenMethodReturnUint(
          escrowEncoder.encodeCalculateTotalValue(),
          escrowValue.toString()
        )
        await instance.setEscrowForLoan(loanID, escrow.address);
      }

      let collateralNeededInTokens;
      switch (status) {
        case NON_EXISTENT:
        case LIQUIDATED:
        case CLOSED:
          collateralNeededInTokens = new BigNumber(0);
          break
        case TERMS_SET:
          collateralNeededInTokens = new BigNumber(loanAmount).multipliedBy(collateralRatio).div(10000);
          break
        case ACTIVE:
          collateralNeededInTokens = new BigNumber(loanAmount)
          if(escrowValue > 0) {
            collateralNeededInTokens = collateralNeededInTokens
              .plus(collateralNeededInTokens.minus(escrowValue));
          }
            
          collateralNeededInTokens = collateralNeededInTokens.multipliedBy(new BigNumber(collateralRatio).minus(interestRate).minus(collateralBuffer)).div(10000).plus(interestOwed);
          break
      }

      const aggregator = await ChainlinkAggregator.at(aggregatorInstance.address)
      const neededInCollateralTokensValueForCalldata = aggregator.contract.methods.valueFor(
        lendingToken.address,
        ETH_ADDRESS,
        collateralNeededInTokens.toString()
      ).encodeABI()
      await aggregatorInstance.givenCalldataReturnUint(
        neededInCollateralTokensValueForCalldata,
        neededInCollateral.toString()
      )

      const collateralInLendingTokensValueForCalldata = aggregator.contract.methods.valueFor(
        ETH_ADDRESS,
        lendingToken.address,
        collateralAmount.toString()
      ).encodeABI()
      await aggregatorInstance.givenCalldataReturn(
        collateralInLendingTokensValueForCalldata,
        '0x'
      );

      const loanValues = await instance.loans(loanID)

      // Invocation

      // values for valueInLendingTokens and neededInCollateralTokens do not need to be validated because they are
      // calling chainlink to convert them. rather we should just check that the chainlink function is being called
      // with the proper values
      const collateralInfo = await instance.getCollateralInfo(loanID);
      const {
        collateral: collateralResult,
        neededInLendingTokens: neededInLendingTokensResult,
        moreCollateralRequired: moreCollateralRequiredResult
      } = collateralInfo;

      // Assertions
      assert.equal(collateralResult.toString(), collateralAmount.toString(), 'Collateral does not match')
      assert.equal(neededInLendingTokensResult.toString(), collateralNeededInTokens.toString(), 'Lending tokens not match');
      assert(moreCollateralRequiredResult === expectedMoreCollateralRequired, 'Expected result not match');
    });
  });
});