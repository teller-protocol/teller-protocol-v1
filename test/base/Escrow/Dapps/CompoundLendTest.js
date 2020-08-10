// JS Libraries
const { withData } = require("leche");
const { t, toBytes32 } = require("../../../utils/consts");
const { dapps } = require('../../../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const CDAI = artifacts.require("./mock/providers/compound/CDAIMock.sol");
const DAI = artifacts.require("./mock/token/DAIMock.sol");

// Smart contracts
const Compound = artifacts.require("./mock/base/Escrow/Dapps/CompoundMock.sol");

contract("CompoundLendTest", function(accounts) {
  let compound;
  let cDai;
  let dai;

  before(async () => {
    compound = await Compound.new()

    dai = await DAI.new();
    cDai = await CDAI.new(dai.address, 2);
  });

  beforeEach(async () => {
  });

  withData({
    _1_insufficient_underlying: [ 100, 0, 0, true, "COMPOUND_INSUFFICIENT_UNDERLYING" ],
    _2_successful_lend: [ 80, 100, 0, false, null ],
  }, function(
    amount,
    balance,
    mintResponse,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("escrow", "lend", "Should be able (or not) to lend tokens on Compound", mustFail), async function() {
      try {
        if (balance > 0) {
          await dai.mint(compound.address, balance)
        }

        const result = await compound.callLend(cDai.address, amount);
        dapps
          .action(result)
          .emitted(toBytes32(web3, 'Compound'), toBytes32(web3, 'lend'))

        const cTokenBalance = await cDai.balanceOf(compound.address)
        assert(cTokenBalance > 0, 'Unable to lend token')

        const tokenBalance = await dai.balanceOf(compound.address)
        const expectedBalance = balance - amount
        assert.equal(tokenBalance.toString(), expectedBalance.toString(), 'Token balance invalid after lend')

        assert(!mustFail);
      } catch (error) {
        assert(mustFail, error.message);
        assert(error);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});
