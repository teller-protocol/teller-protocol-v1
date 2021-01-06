// JS Libraries
const withData = require("leche").withData;
const BN = require('bignumber.js')

const { t, getLatestTimestamp, ONE_HOUR, FIVE_MIN, NULL_ADDRESS, TERMS_SET, ACTIVE, TEN_THOUSAND, ONE_YEAR } = require("../utils/consts");
const { createLoanTerms } = require("../utils/structs");
const { loans } = require("../utils/events");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { createLoan } = require('../utils/loans')
const settingsNames = require('../utils/platformSettingsNames')

const EscrowFactoryEncoder = require("../utils/encoders/EscrowFactoryEncoder");
const ATMSettingsEncoder = require("../utils/encoders/ATMSettingsEncoder");
const MarketsStateEncoder = require("../utils/encoders/MarketsStateEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const LINKMock = artifacts.require("./mock/token/LINKMock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Loans = artifacts.require("./mock/base/LoansBaseMock.sol");

// Libraries
const LoanLib = artifacts.require("../util/LoanLib.sol");

contract("LoansBaseTakeOutLoanTest", function(accounts) {
  const escrowFactoryEncoder = new EscrowFactoryEncoder(web3);
  const atmSettingsEncoder = new ATMSettingsEncoder(web3);
  const marketsStateEncoder = new MarketsStateEncoder(web3);

  const owner = accounts[0];
  let instance;
  let loanTermsConsInstance;
  let collateralTokenInstance;
  let chainlinkAggregatorInstance;
  let atmSettingsInstance;
  let marketsStateInstance;

  const mockLoanID = 0;
  const overCollateralizedBuffer = 13000
  const safetyInterval = FIVE_MIN

  const borrower = accounts[3];

  beforeEach("Setup for each test", async () => {
    const lendingPoolInstance = await Mock.new();
    const lendingTokenInstance = await Mock.new();
    collateralTokenInstance = await LINKMock.new();
    const settingsInstance = await createTestSettingsInstance(
      Settings,
      {
        from: owner,
        Mock,
        initialize: true,
        onInitialize: async (instance, { escrowFactory, chainlinkAggregator, atmSettings, marketsState }) => {
          const newEscrowInstance = await Mock.new();
          await escrowFactory.givenMethodReturnAddress(
            escrowFactoryEncoder.encodeCreateEscrow(),
            newEscrowInstance.address
          );

          chainlinkAggregatorInstance = chainlinkAggregator;
          atmSettingsInstance = atmSettings;
          marketsStateInstance = marketsState;
        }
      }, {
        [settingsNames.OverCollateralizedBuffer]: overCollateralizedBuffer,
        [settingsNames.SafetyInterval]: safetyInterval,
      });

    loanTermsConsInstance = await Mock.new();
    const loanLib = await LoanLib.new();
    await Loans.link("LoanLib", loanLib.address);
    instance = await Loans.new();
    await instance.initialize(
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address,
      collateralTokenInstance.address
    );
    const atmGovernance = await Mock.new();
    await atmSettingsInstance.givenMethodReturnAddress(
      atmSettingsEncoder.encodeGetATMForMarket(),
      atmGovernance.address
    );

  });

  withData({
    _1_max_loan_exceeded: [ 15000001, false, false, 300000, NULL_ADDRESS, 0, false, false, true, "MAX_LOAN_EXCEEDED" ],
    _2_loan_terms_expired: [ 15000000, true, false, 300000, NULL_ADDRESS, 0, false, false, true, "LOAN_TERMS_EXPIRED" ],
    _3_collateral_deposited_recently: [ 15000000, false, true, 300000, NULL_ADDRESS, 0, false, false, true, "COLLATERAL_DEPOSITED_RECENTLY" ],
    _4_more_collateral_needed: [ 15000000, false, false, 300000, NULL_ADDRESS, 45158, false, true, true, "MORE_COLLATERAL_REQUIRED" ],
    _5_successful_loan: [ 15000000, false, false, 300000, NULL_ADDRESS, 40000, false, false, false, undefined ],
    _6_with_recipient: [ 15000000, false, false, 300000, accounts[4], 40000, false, false, false, undefined ],
    _7_debt_ratio_maxed: [ 15000000, false, false, 300000, accounts[4], 40000, true, false, true, 'DEBT_RATIO_EXCEEDS_MAX' ]
  }, function(
    amountToBorrow,
    termsExpired,
    collateralTooRecent,
    loanDuration,
    recipient,
    oraclePrice,
    debtRatioInvalid,
    moreCollateralRequired,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("user", "takeOutLoan", "Should able to take out a loan.", false), async function() {
      // Setup
      const timeNow = new BN(await getLatestTimestamp());
      await collateralTokenInstance.mint(borrower, amountToBorrow);

      let termsExpiry
      if (termsExpired) {
        termsExpiry = timeNow.minus(1);
      } else {
        termsExpiry = timeNow.plus(FIVE_MIN);
      }

      let lastCollateralIn = timeNow.minus(ONE_HOUR)
      if (collateralTooRecent) {
        lastCollateralIn = timeNow
      }

      let loanTerms = createLoanTerms(borrower, recipient, 1475, 3564, 15000000, loanDuration);
      const loan = createLoan({
        id: mockLoanID,
        loanTerms,
        collateral: 40000,
        lastCollateralIn: lastCollateralIn.toString(),
        borrowedAmount: amountToBorrow,
        status: TERMS_SET,
        termsExpiry: termsExpiry.toString()
      });
      await instance.setLoan(loan);
      await collateralTokenInstance.approve(instance.address, amountToBorrow, { from: borrower });
      if (moreCollateralRequired) {
        await instance.mockGetCollateralInfo(mockLoanID, loan.borrowedAmount, (loan.collateral*2))
      } else {
        await instance.mockGetCollateralInfo(mockLoanID, loan.borrowedAmount, loan.collateral)
      }
      if (debtRatioInvalid) {
        await marketsStateInstance.givenMethodReturnUint(
          marketsStateEncoder.encodeGetDebtRatioFor(),
          2000,
        );
      }
      
      try {
        // Invocation
        const tx = await instance.takeOutLoan(mockLoanID, amountToBorrow, { from: borrower });

        // Assertions
        assert(!mustFail, "It should have failed because data is invalid.");
        assert(tx);

        const txTime = (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp;
        const interestRatio = new BN(loanTerms.interestRate).multipliedBy(loanTerms.duration).div(ONE_YEAR).toFixed(0)
        const interestOwed = new BN(amountToBorrow).multipliedBy(interestRatio).div(10000).toFixed(0);
        const loan = await instance.loans.call(mockLoanID);

        assert.equal(loan.loanStartTime.toString(), txTime, 'loan start time not match');
        assert.equal(loan.principalOwed.toString(), amountToBorrow, 'loan principal owed not match');
        assert.equal(loan.interestOwed.toString(), interestOwed, 'loan interest owed not match');
        assert.equal(loan.status.toString(), ACTIVE, 'loan status not match');
        assert(loan.escrow.toString() !== NULL_ADDRESS, 'loan does not have an escrow');

        loans
          .loanTakenOut(tx)
          .emitted(mockLoanID, borrower, loan.escrow, amountToBorrow);

      } catch (error) {
        assert(mustFail, error.message);
        assert.equal(error.reason, expectedErrorMessage, error.reason);
      }
    });
  });
});
