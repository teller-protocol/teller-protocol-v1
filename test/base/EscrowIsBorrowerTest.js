// JS Libraries
const { NULL_ADDRESS } = require("../utils/consts");
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { assert } = require("chai");
const { encodeLoanParameter } = require("../utils/loans");
const LoansBaseInterfaceEncoder = require("../utils/encoders/LoansBaseInterfaceEncoder");
const ERC20InterfaceEncoder = require("../utils/encoders/ERC20InterfaceEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");const Escrow = artifacts.require("./base/Escrow.sol");

// Smart contracts
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");

contract('EscrowIsBorrowerTest', function (accounts) {
  const loansEncoder = new LoansBaseInterfaceEncoder(web3)
  const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
  let escrowFactory;
  let settingsInstance;
  let instance;
  let loans;

  beforeEach(async () => {
    settingsInstance = await Mock.new();
    loans = await Mock.new();
    
    instance = await Escrow.new();
    escrowFactory = await EscrowFactory.new();
    await escrowFactory.initialize(settingsInstance.address);
  })

  withData({
    _1_valid: [1234, 1, false],
    _2_sender_not_borrower: [1234, 2, false],
  }, function(
    loanID,
    borrowerIndex,
    mustFail
  ) {
    it(t('loans', 'isBorrower', 'Should be able (or not) to test whether sender is a borrower or not.', mustFail), async function() {
      // Setup
      const borrower = borrowerIndex === -1 ? NULL_ADDRESS : accounts[borrowerIndex];
      const daiMock = await Mock.new();
      await daiMock.givenMethodReturnUint(
        erc20InterfaceEncoder.encodeBalanceOf(),
        '1000000',
      );
      await loans.givenMethodReturnAddress(
        loansEncoder.encodeLendingToken(),
        daiMock.address
      )
      await loans.givenMethodReturnAddress(
        loansEncoder.encodeLendingToken(),
        daiMock.address
      )
      await loans.givenMethodReturn(
        loansEncoder.encodeLoans(),
        encodeLoanParameter(web3, { loanTerms: { borrower } })
      )

      await instance.initialize(loans.address, loanID);

      try {
        // Invocation
        const result = await instance.getBorrower();
        
        // Assertions
        assert(!mustFail);
        assert(result);
        assert.equal(
          result,
          borrower,
          "Borrower is not equal to the loan."
        )
      } catch (error) {
        assert(mustFail, error);
        assert(error);
      }
    });
  });
});
