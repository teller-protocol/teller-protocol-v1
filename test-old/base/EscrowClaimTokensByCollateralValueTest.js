// JS Libraries
const ChainlinkAggregatorEncoder = require("../utils/encoders/ChainlinkAggregatorEncoder");
const loanStatus = require("../utils/loanStatus");
const { createLoan } = require('../utils/loans');
const { escrow } = require("../utils/events");
const { withData } = require("leche");
const { t } = require("../utils/consts");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const truffleAssertions = require("truffle-assertions");

// Mock contracts
const DAI = artifacts.require("./mock/token/DAIMock.sol");
const ERC20 = artifacts.require("./mock/token/ERC20Mock.sol");
const Mock = artifacts.require("./mock/util/Mock.sol");
const Escrow = artifacts.require("./mock/base/EscrowMock.sol");
const LoansBase = artifacts.require("./mock/base/LoansBaseMock.sol");

// Libraries
const LoanLib = artifacts.require("../util/LoanLib.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract("EscrowClaimTokensByCollateralValueTest", function(accounts) {

  let loans;
  let instance;
  let chainlinkAggregatorInstance;
  let collateralTokenInstance;

  beforeEach(async () => {
    const loanLib = await LoanLib.new();
    await LoansBase.link("LoanLib", loanLib.address);
    loans = await LoansBase.new();
    const settings = await createTestSettingsInstance(
      Settings, {
        from: accounts[0], Mock, initialize: true,
        onInitialize: async (instance, {
          chainlinkAggregator
        }) => {
          chainlinkAggregatorInstance = chainlinkAggregator
        }
      }
    )
    collateralTokenInstance = await ERC20.new('', '', 18, 10000); 
    await loans.initialize(
      (await Mock.new()).address,
      (await Mock.new()).address,
      settings.address,
      collateralTokenInstance.address
    )
    instance = await Escrow.new();
  });

  withData({
    _1_loan_active: [ loanStatus.Active, accounts[1], accounts[2], false, 0, 0, true, true, "LOAN_NOT_CLOSED" ],
    _2_loan_closed_not_liquidated: [ loanStatus.Closed, accounts[1], accounts[2], false, 0, 0, true, true, "LOAN_NOT_LIQUIDATED" ],
    _3_loan_liquidated: [ loanStatus.Closed, accounts[1], accounts[2], true, 2, 1000, true, false, null ],
    _4_loan_liquidated_caller_not_loans_instance: [ loanStatus.Closed, accounts[1], accounts[2], true, 2, 1000, false, true, "CALLER_MUST_BE_LOANS" ],
  }, function(
    status,
    recipient,
    borrower,
    liquidated,
    tokensCount,
    tokenBalance,
    isCallerLoans,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("user", "claimTokensByCollateralValue", "Should be able to claim tokens based on the value of collateral.", mustFail), async function() {
      // Setup
      const loan = createLoan({ status, liquidated, escrow: instance.address, loanTerms: { borrower, recipient } });
      await loans.setLoan(loan);
      await instance.mockInitialize(loans.address, loan.id, { from: borrower });

      const tokens = [];
      for (let i = 0; i < tokensCount; i++) {
        const token = await DAI.new();
        await token.mint(instance.address, tokenBalance);
        tokens.push(token.address);
        await instance.mockValueOfIn(token.address, collateralTokenInstance.address, tokenBalance);
      }

      await instance.externalSetTokens(tokens);

      try {
        // Invocation
        let result;
        if (isCallerLoans) {
          const loansTx = await loans.externalEscrowClaimTokensByCollateralValue(recipient, tokenBalance, loan.id);
          result = await truffleAssertions.createTransactionResult(instance, loansTx.tx);
        } else {
          result = await instance.claimTokensByCollateralValue(recipient, tokenBalance, { from: borrower });
        }
        // Assertions
        const token = await DAI.at(tokens[0]);
        const recipientBalance = await token.balanceOf(recipient);

        assert.equal(recipientBalance.toString(), tokenBalance.toString(), 'Recipient did not receive tokens');

        escrow
          .tokensClaimed(result)
          .emitted(recipient);
        
      } catch (error) {
        assert(mustFail, error.message);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
