// JS Libraries
const { withData } = require("leche");
const { assert } = require("chai");

const { t } = require("../../../utils/consts");
const { compound } = require("../../../utils/events");
const { createTestSettingsInstance } = require('../../../utils/settings-helper');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const CDAI = artifacts.require("./mock/providers/compound/CDAIMock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Compound = artifacts.require("./mock/base/escrow/dapps/CompoundMock.sol");

contract("CompoundRedeemTest", function(accounts) {
  const SIMULATE_COMPOUND_REDEEM_UNDERLYING_RETURN_ERROR = 66666666;
  const SIMULATE_COMPOUND_REDEEM_UNDERLYING_ERROR = 55555555;


  let cDai;
  let dai;

  beforeEach(async () => {
    dai = await DAI.new();
    cDai = await CDAI.new(dai.address, 1);
  });

  withData({
    _1_successful_redeem: [ 80, 100, false, false, null ],
    _2_successful_redeem_all: [ 80, 100, true, false, null ],
    _3_insufficient_balance: [ 100, 0, false, true, "COMPOUND_INSUFFICIENT_BALANCE" ],
    _4_compound_return_error: [ SIMULATE_COMPOUND_REDEEM_UNDERLYING_ERROR, SIMULATE_COMPOUND_REDEEM_UNDERLYING_ERROR, false, true, "COMPOUND_BALANCE_NOT_INCREASED" ],
    _5_compound_redeem_error: [ SIMULATE_COMPOUND_REDEEM_UNDERLYING_RETURN_ERROR, SIMULATE_COMPOUND_REDEEM_UNDERLYING_RETURN_ERROR, false, true, "COMPOUND_WITHDRAWAL_ERROR" ],
   }, function(
    amount,
    balance,
    redeemAll,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("escrow", "redeem", "Should be able (or not) to redeem tokens on Compound", mustFail), async function() {
      // Setup
      const settings = await createTestSettingsInstance(Settings, { Mock });
      await settings.createAssetSettings(dai.address, cDai.address, 1)

      const instance = await Compound.new(settings.address);

      if (balance > 0) {
        await cDai.mint(instance.address, balance);
      }

      try {
        // Invocation
        let result;
        if (redeemAll) {
          amount = balance;
          result = await instance.redeemAll(dai.address);
        } else {
          result = await instance.redeem(dai.address, amount);
        }

        // Validations

        const tokens = await instance.getTokens();
        assert(tokens.includes(dai.address), "Token not added to the tokens list")
        if (amount === balance) {
          assert(!tokens.includes(cDai.address), "Compound still in the tokens list")
        } else {
          assert(tokens.includes(cDai.address), "Compound token not added to the tokens list")
        }

        const cTokenBalance = await cDai.balanceOf(instance.address)
        const tokenBalance = await dai.balanceOf(instance.address);

        assert(!mustFail, "It should have failed because data is invalid.");
        compound
          .compoundRedeemed(result)
          .emitted(
            dai.address,
            cDai.address,
            amount,
            tokenBalance,
            cTokenBalance
          );
      } catch (error) {
        assert(mustFail, error.message);
        assert.equal(error.reason, expectedErrorMessage, error.message);
      }
    });
  });
});
