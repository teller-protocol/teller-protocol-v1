// JS Libraries
const { withData } = require("leche");
const { t } = require("../../../utils/consts");
const { compound } = require('../../../utils/events');

// Mock contracts
const CDAI = artifacts.require("./mock/providers/compound/CDAIMock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Compound = artifacts.require("./mock/base/Escrow/Dapps/CompoundMock.sol");

contract("CompoundLendTest", function(accounts) {
  const SIMULATE_COMPOUND_MINT_RETURN_ERROR = 88888888;
  const SIMULATE_COMPOUND_MINT_ERROR = 77777777;

  let instance;
  let cDai;
  let dai;

  beforeEach(async () => {
    instance = await Compound.new();  
    dai = await DAI.new();
    cDai = await CDAI.new(dai.address, 2);
  });

  withData({
    _1_successful_lend: [ 80, 100, false, null ],
    _2_insufficient_underlying: [ 100, 0, true, "COMPOUND_INSUFFICIENT_UNDERLYING" ],
    _3_compound_return_error: [ SIMULATE_COMPOUND_MINT_RETURN_ERROR, SIMULATE_COMPOUND_MINT_RETURN_ERROR, true, "COMPOUND_DEPOSIT_ERROR" ],
    _4_compound_mint_error: [ SIMULATE_COMPOUND_MINT_ERROR, SIMULATE_COMPOUND_MINT_ERROR, true, "COMPOUND_BALANCE_NOT_INCREASED" ],
  }, function(
    amount,
    balance,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("compound", "lend", "Should be able (or not) to lend tokens on Compound", mustFail), async function() {
      // Setup
      const sender = accounts[0];
      if (balance > 0) {
        await dai.mint(instance.address, balance)
      }

      try {
        // Invocation
        const result = await instance.callLend(cDai.address, amount, {from: sender});
        assert(!mustFail, 'It should have failed because data is invalid.');

        // Validating events emmited 
        compound
          .compoundLended(result)
          .emitted(
            sender,
            instance.address,
            cDai.address,
            dai.address,
            amount
          );

        // Validating state changes
        const cTokenBalance = await cDai.balanceOf(instance.address)
        assert(cTokenBalance > 0, 'Unable to lend token')

        const tokenBalance = await dai.balanceOf(instance.address)
        const expectedBalance = balance - amount
        assert.equal(tokenBalance.toString(), expectedBalance.toString(), 'Token balance invalid after lend')

      } catch (error) {
        assert(mustFail, error.message);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
