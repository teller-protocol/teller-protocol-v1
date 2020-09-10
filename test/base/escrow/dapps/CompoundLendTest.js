// JS Libraries
const { withData } = require("leche");
const { t, DUMMY_ADDRESS } = require("../../../utils/consts");
const { compound } = require('../../../utils/events');
const { assert } = require("chai");

// Mock contracts
const CDAI = artifacts.require("./mock/providers/compound/CDAIMock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Compound = artifacts.require("./mock/base/escrow/dapps/CompoundMock.sol");

contract("CompoundLendTest", function(accounts) {
  const owner = accounts[0];

  const SIMULATE_COMPOUND_MINT_RETURN_ERROR = 88888888;
  const SIMULATE_COMPOUND_MINT_ERROR = 77777777;

  let instance;
  let cDai;
  let dai;

  beforeEach(async () => {
    instance = await Compound.new({ from: owner });
    dai = await DAI.new();
    cDai = await CDAI.new(dai.address, 2);
  });

  withData({
    _1_successful_lend: [ owner, 80, 100, false, false, null ],
    _2_insufficient_underlying: [ owner, 100, 0, false, true, "COMPOUND_INSUFFICIENT_UNDERLYING" ],
    _3_compound_return_error: [ owner, SIMULATE_COMPOUND_MINT_RETURN_ERROR, SIMULATE_COMPOUND_MINT_RETURN_ERROR, false, true, "COMPOUND_DEPOSIT_ERROR" ],
    _4_compound_mint_error: [ owner, SIMULATE_COMPOUND_MINT_ERROR, SIMULATE_COMPOUND_MINT_ERROR, false, true, "COMPOUND_BALANCE_NOT_INCREASED" ],
    _5_compound_ctoken_not_contract: [ owner, 80, 100, true, true, "CTOKEN_ADDRESS_MUST_BE_CONTRACT" ],
  }, function(
    sender,
    amount,
    balance,
    cTokenNotContract,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("compound", "lend", "Should be able (or not) to lend tokens on Compound", mustFail), async function() {
      // Setup
      if (balance > 0) {
        await dai.mint(instance.address, balance);
      }
      if (cTokenNotContract) {
        cDai.address = DUMMY_ADDRESS; 
      }
      try {
        // Invocation
        const result = await instance.lend(cDai.address, amount, { from: sender });
        assert(!mustFail, "It should have failed because data is invalid.");

        // Validating state changes
        const cTokenBalance = await cDai.balanceOf(instance.address)
        assert(cTokenBalance > 0, 'Unable to lend token')
        const cTokenContractBalance = await instance.balanceOf(cDai.address)
        assert.equal(cTokenBalance.toString(), cTokenContractBalance.toString(), "Contract balance error");
        const tokenBalance = await dai.balanceOf(instance.address);
        const expectedBalance = balance - amount;
        assert.equal(tokenBalance.toString(), expectedBalance.toString(), "Token balance invalid after lend");

        // Validating events emmited correctly
        compound
          .compoundLended(result)
          .emitted(
            sender,
            instance.address,
            amount,
            cDai.address,
            cTokenContractBalance,
            dai.address,
            tokenBalance
          );
      } catch (error) {
        assert(mustFail, error.message);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
