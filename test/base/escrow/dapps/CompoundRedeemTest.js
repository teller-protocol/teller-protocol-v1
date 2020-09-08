// JS Libraries
const { withData } = require("leche");
const { t, DUMMY_ADDRESS } = require("../../../utils/consts");
const Timer = require("../../../../scripts/utils/Timer");
const { minutesToSeconds } = require("../../../utils/consts");
const { compound } = require('../../../utils/events');
const { assert } = require("chai");

// Mock contracts
const CDAI = artifacts.require("./mock/providers/compound/CDAIMock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Compound = artifacts.require("../base/escrow/dapps/Compound.sol");

contract("CompoundRedeemTest", function(accounts) {
  const SIMULATE_COMPOUND_REDEEM_UNDERLYING_RETURN_ERROR = 66666666;
  const SIMULATE_COMPOUND_REDEEM_UNDERLYING_ERROR = 55555555;


  let instance;
  let cDai;
  let dai;

  let timer = new Timer(web3)

  beforeEach(async () => {
    instance = await Compound.new();
    dai = await DAI.new();
    cDai = await CDAI.new(dai.address, 1);
  });

  withData({
    _1_successful_redeem: [ 80, 100, false, false, false, null ],
    _2_successful_redeem_all: [ 80, 100, true, false, false, null ],
    _3_insufficient_balance: [ 100, 0, false, false, true, "COMPOUND_INSUFFICIENT_BALANCE" ],
    _4_compound_return_error: [ SIMULATE_COMPOUND_REDEEM_UNDERLYING_ERROR, SIMULATE_COMPOUND_REDEEM_UNDERLYING_ERROR, false, false, true, "COMPOUND_BALANCE_NOT_INCREASED" ],
    _5_compound_redeem_error: [ SIMULATE_COMPOUND_REDEEM_UNDERLYING_RETURN_ERROR, SIMULATE_COMPOUND_REDEEM_UNDERLYING_RETURN_ERROR, false, false, true, "COMPOUND_WITHDRAWAL_ERROR" ],
    _6_cToken_not_contract: [ 80, 100, false, true, true, "CTOKEN_ADDRESS_MUST_BE_CONTRACT" ],
   }, function(
    amount,
    underlyingBalance,
    redeemAll,
    cTokenNotContract,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("escrow", "redeem", "Should be able (or not) to redeem tokens on Compound", mustFail), async function() {
      // Setup
      const sender = accounts[0];
      if (underlyingBalance > 0) {
        await dai.mint(instance.address, underlyingBalance);
        await instance.lend(cDai.address, underlyingBalance); 

        const nextTimestamp = await timer.getCurrentTimestampInSecondsAndSum(minutesToSeconds(2));
        await timer.advanceBlockAtTime(nextTimestamp)
      }
      if (cTokenNotContract) {
        cDai.address = DUMMY_ADDRESS; 
      }
      try {
        const cBalanceBeforeRedeem = await cDai.balanceOf(instance.address)
        // Invocation
        let result;
        if (redeemAll) {
          amount = cBalanceBeforeRedeem;
          result = await instance.redeemAll(cDai.address, {from: sender});
        } else {
          result = await instance.redeem(cDai.address, amount, {from: sender});
        }
        assert(!mustFail, 'It should have failed because data is invalid.');

        // Validating state changes
        const cBalance = await cDai.balanceOf(instance.address)

        // Validating events were emitted
        compound
        .compoundRedeemed(result)
        .emitted(
          sender,
          instance.address,
          amount,
          cDai.address,
          cBalance,
          dai.address,
          amount
        );
      } catch (error) {
        assert(mustFail, error.message);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
