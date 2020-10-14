// JS Libraries
const { withData } = require("leche");
const { t, DUMMY_ADDRESS } = require("../../../utils/consts");
const { compound } = require('../../../utils/events');
const { assert } = require("chai");

const { createTestSettingsInstance } = require('../../../utils/settings-helper');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const CDAI = artifacts.require("./mock/providers/compound/CDAIMock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Compound = artifacts.require("./mock/base/escrow/dapps/CompoundMock.sol");

contract("CompoundLendTest", function(accounts) {
  const SIMULATE_COMPOUND_MINT_RETURN_ERROR = 88888888;
  const SIMULATE_COMPOUND_MINT_ERROR = 77777777;

  let cDai;
  let dai;

  beforeEach(async () => {
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
      const settings = await createTestSettingsInstance(Settings, { Mock });
      await settings.createAssetSettings(dai.address, cDai.address, 1)

      const instance = await Compound.new(settings.address);

      // Setup
      if (balance > 0) {
        await dai.mint(instance.address, balance);
      }

      try {
        // Invocation
        const result = await instance.lend(dai.address, amount);

        const cTokenBalance = await cDai.balanceOf(instance.address)
        const tokenBalance = await dai.balanceOf(instance.address);

        // Validating events emmited correctly
        assert(!mustFail, "It should have failed because data is invalid.");
        compound
          .compoundLended(result)
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
