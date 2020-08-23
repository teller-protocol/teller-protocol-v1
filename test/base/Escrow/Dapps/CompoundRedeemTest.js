// JS Libraries
const { withData } = require("leche");
const { t, toBytes32 } = require("../../../utils/consts");
const Timer = require("../../../../scripts/utils/Timer");
const { minutesToSeconds } = require("../../../utils/consts");
const { compound } = require('../../../utils/events');

// Mock contracts
const CDAI = artifacts.require("./mock/providers/compound/CDAIMock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Compound = artifacts.require("./mock/base/Escrow/Dapps/CompoundMock.sol");

contract("CompoundRedeemTest", function(accounts) {
  const SIMULATE_COMPOUND_RETURN_ERROR = 88888888;
  const SIMULATE_COMPOUND_ACTION_ERROR = 77777777;

  let instance;
  let cDai;
  let dai;

  let timer = new Timer(web3)

  beforeEach(async () => {
    instance = await Compound.new();
    dai = await DAI.new();
    cDai = await CDAI.new(dai.address, 2);
  });

  withData({
    //_1_successful_redeem: [ 80, 100, false, null ],
    //_2_insufficient_balance: [ 100, 0, true, "COMPOUND_INSUFFICIENT_BALANCE" ],
    _3_compound_return_error: [ SIMULATE_COMPOUND_RETURN_ERROR, SIMULATE_COMPOUND_RETURN_ERROR, true, "COMPOUND_WITHDRAWAL_ERROR" ],
    _4_compound_redeem_error: [ SIMULATE_COMPOUND_ACTION_ERROR, SIMULATE_COMPOUND_ACTION_ERROR, true, "COMPOUND_BALANCE_NOT_INCREASED" ],
   }, function(
    amount,
    underlyingBalance,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("escrow", "redeem", "Should be able (or not) to redeem tokens on Compound", mustFail), async function() {
      // Setup
      const sender = accounts[0];
      if (underlyingBalance > 0) {
        await dai.mint(instance.address, underlyingBalance);
        // const b = await dai.balanceOf(instance.address)
        // console.log("after mint:" + b.toString());
        await instance.callLend(cDai.address, underlyingBalance);

        const nextTimestamp = await timer.getCurrentTimestampInSecondsAndSum(minutesToSeconds(2));
        await timer.advanceBlockAtTime(nextTimestamp)
      }
      try {
        console.log(sender);
        console.log(instance.address); 

        const cBalanceBeforeRedeem = await cDai.balanceOf(instance.address)
      /*  const balanceBeforeRedeem = await dai.balanceOf(instance.address)
        const bal = await dai.balanceOf(sender)
        console.log(cBalanceBeforeRedeem.toString());
        console.log(balanceBeforeRedeem.toString());
        console.log(bal.toString());
*/
        // Invocation
        const result = await instance.callRedeem(cDai.address, amount, {from: sender});
        assert(!mustFail, 'It should have failed because data is invalid.');

        // Validating events were emitted
        compound
          .compoundRedeemed(result)
          .emitted(
            sender,
            instance.address,
            cDai.address,
            dai.address,
            amount
          );

        // Validating state changes
        const cBalance = await cDai.balanceOf(instance.address)
       /* const balance = await dai.balanceOf(instance.address)
        const sbalance = await dai.balanceOf(sender)
        console.log("cOld:" + cBalanceBeforeRedeem.toString() + " cNew:" + cBalance.toString());
        console.log("Old:" + balanceBeforeRedeem.toString() + " New:" + balance.toString());
        console.log("sOld:" + bal.toString() + " sNew:" + sbalance.toString());
        */const expectedBalance = cBalanceBeforeRedeem - amount
        assert.equal(cBalance.toString(), expectedBalance.toString(), 'CToken balance not empty after redeem')
      } catch (error) {
        console.log(error);
        assert(mustFail, error.message);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
