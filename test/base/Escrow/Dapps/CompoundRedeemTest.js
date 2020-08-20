// JS Libraries
const { withData } = require("leche");
const { t, toBytes32 } = require("../../../utils/consts");
const Timer = require("../../../../scripts/utils/Timer");
const { minutesToSeconds } = require("../../../utils/consts");
const { dapps } = require('../../../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const CDAI = artifacts.require("./mock/providers/compound/CDAIMock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Compound = artifacts.require("./mock/base/Escrow/Dapps/CompoundMock.sol");

contract("CompoundRedeemTest", function(accounts) {

  let compound;
  let cDai;
  let dai;

  let timer = new Timer(web3)

  before(async () => {
    compound = await Compound.new()

    dai = await DAI.new();
    cDai = await CDAI.new(dai.address, 2);
  });

  beforeEach(async () => {
  });

  withData({
    _1_insufficient_balance: [ 100, 0, 0, true, "COMPOUND_INSUFFICIENT_BALANCE" ],
    _2_successful_redeem: [ 80, 100, 0, false, null ],
  }, function(
    amount,
    underlyingBalance,
    mintResponse,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("escrow", "redeem", "Should be able (or not) to redeem tokens on Compound", mustFail), async function() {
      // Setup
      if (underlyingBalance > 0) {
        await dai.mint(compound.address, underlyingBalance)
        await compound.callLend(cDai.address, underlyingBalance);

        const nextTimestamp = await timer.getCurrentTimestampInSecondsAndSum(minutesToSeconds(2));
        await timer.advanceBlockAtTime(nextTimestamp)
      }
      const cBalanceBeforeRedeem = await cDai.balanceOf(compound.address)

      try {
        // Invocation
        const result = await compound.callRedeem(cDai.address, amount);

        // Assertions
        assert(!mustFail);
        dapps
          .action(result)
          .emitted(toBytes32(web3, 'Compound'), toBytes32(web3, 'redeem'))

        const cBalance = await cDai.balanceOf(compound.address)
        const expectedBalance = cBalanceBeforeRedeem - amount
        assert.equal(cBalance.toString(), expectedBalance.toString(), 'CToken balance not empty after redeem')
      } catch (error) {
        assert(mustFail, error.message);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
