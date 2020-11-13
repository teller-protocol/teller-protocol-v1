// JS Libraries
const withData = require("leche").withData;

const { t, getLatestTimestamp, FIVE_MIN, NULL_ADDRESS, TERMS_SET, ACTIVE, TEN_THOUSAND, SECONDS_PER_YEAR_4DP } = require("../utils/consts");
const { createLoanTerms } = require("../utils/structs");
const { loans } = require("../utils/events");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { createLoan } = require('../utils/loans')

const ERC20InterfaceEncoder = require("../utils/encoders/ERC20InterfaceEncoder");
const ChainlinkAggregatorEncoder = require("../utils/encoders/ChainlinkAggregatorEncoder");
const LendingPoolInterfaceEncoder = require("../utils/encoders/LendingPoolInterfaceEncoder");
const EscrowFactoryInterfaceEncoder = require("../utils/encoders/EscrowFactoryInterfaceEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const LINKMock = artifacts.require("./mock/token/LINKMock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Loans = artifacts.require("./mock/base/TokenCollateralLoansMock.sol");

contract("TokenCollateralLoansTakeOutLoanTest", function(accounts) {
  const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
  const chainlinkAggregatorEncoder = new ChainlinkAggregatorEncoder(web3);
  const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3);
  const escrowFactoryInterfaceEncoder = new EscrowFactoryInterfaceEncoder(web3);

  const owner = accounts[0];
  let instance;
  let chainlinkAggregatorInstance;
  let loanTermsConsInstance;
  let lendingTokenInstance;
  let collateralTokenInstance;

  const mockLoanID = 0;

  const borrower = accounts[3];

  let loanTerms = createLoanTerms(borrower, NULL_ADDRESS, 1475, 3564, 15000000, 0);

  beforeEach("Setup for each test", async () => {
    const lendingPoolInstance = await Mock.new();
    lendingTokenInstance = await Mock.new();
    collateralTokenInstance = await LINKMock.new();
    const settingsInstance = await createTestSettingsInstance(
      Settings,
      {
        from: owner,
        Mock,
        initialize: true,
        onInitialize: async (instance, { escrowFactory, chainlinkAggregator }) => {
          const newEscrowInstance = await Mock.new();
          await escrowFactory.givenMethodReturnAddress(
            escrowFactoryInterfaceEncoder.encodeCreateEscrow(),
            newEscrowInstance.address
          );

          chainlinkAggregatorInstance = chainlinkAggregator
        }
      });

    loanTermsConsInstance = await Mock.new();
    instance = await Loans.new();
    await instance.initialize(
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address,
      collateralTokenInstance.address
    );

    // encode lending token address
    const encodeLendingToken = lendingPoolInterfaceEncoder.encodeLendingToken();
    await lendingPoolInstance.givenMethodReturnAddress(encodeLendingToken, lendingTokenInstance.address);
  });

  withData({
    _1_max_loan_exceeded: [ 15000001, false, false, 300000, NULL_ADDRESS, 0, 0, true, "MAX_LOAN_EXCEEDED" ],
    _2_loan_terms_expired: [ 15000000, true, false, 300000, NULL_ADDRESS, 0, 0, true, "LOAN_TERMS_EXPIRED" ],
    _3_collateral_deposited_recently: [ 15000000, false, true, 300000, NULL_ADDRESS, 0, 0, true, "COLLATERAL_DEPOSITED_RECENTLY" ],
    _4_more_collateral_needed: [ 15000000, false, false, 300000, NULL_ADDRESS, 45158, 18, true, "MORE_COLLATERAL_REQUIRED" ],
    _5_successful_loan: [ 15000000, false, false, 300000, NULL_ADDRESS, 40000, 18, false, undefined ],
    _6_with_recipient: [ 15000000, false, false, 300000, accounts[4], 40000, 18, false, undefined ]
  }, function(
    amountToBorrow,
    termsExpired,
    collateralTooRecent,
    loanDuration,
    recipient,
    oraclePrice,
    tokenDecimals,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("user", "takeOutLoan", "Should able to take out a loan.", false), async function() {
      // Setup
      const timeNow = await getLatestTimestamp();
      await collateralTokenInstance.mint(loanTerms.borrower, amountToBorrow);

      // encode current token price
      await chainlinkAggregatorInstance.givenMethodReturnUint(
        chainlinkAggregatorEncoder.encodeValueFor(),
        oraclePrice.toString()
      );

      // encode token decimals
      const encodeDecimals = erc20InterfaceEncoder.encodeDecimals();
      await lendingTokenInstance.givenMethodReturnUint(encodeDecimals, tokenDecimals);

      let termsExpiry = timeNow;
      if (termsExpired) {
        termsExpiry -= 1;
      } else {
        termsExpiry += FIVE_MIN;
      }

      let lastCollateralIn = timeNow + FIVE_MIN;
      if (!collateralTooRecent) {
        lastCollateralIn -= FIVE_MIN;
      }

      loanTerms.duration = loanDuration;
      loanTerms.recipient = recipient;
      const loan = createLoan({
        id: mockLoanID,
        loanTerms,
        collateral: 40000,
        lastCollateralIn,
        borrowedAmount: loanTerms.maxLoanAmount,
        status: TERMS_SET,
        termsExpiry
      });
      await instance.setLoan(loan);
      await collateralTokenInstance.approve(instance.address, amountToBorrow, { from: borrower });
      try {
        // Invocation
        const tx = await instance.takeOutLoan(mockLoanID, amountToBorrow, { from: borrower });

        // Assertions
        assert(!mustFail, "It should have failed because data is invalid.");
        assert(tx);

        const txTime = (await web3.eth.getBlock(tx.receipt.blockNumber)).timestamp;
        const interestOwed = Math.floor(amountToBorrow * 1475 * loanDuration / TEN_THOUSAND / SECONDS_PER_YEAR_4DP);
        const loan = await instance.loans.call(mockLoanID);

        assert.equal(loan.loanStartTime.toString(), txTime);
        assert.equal(loan.principalOwed.toString(), amountToBorrow);
        assert.equal(loan.interestOwed.toString(), interestOwed);
        assert.equal(loan.status.toString(), ACTIVE);
        assert(loan.escrow.toString() !== NULL_ADDRESS);

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