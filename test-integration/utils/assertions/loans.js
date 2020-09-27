const assert = require('assert');
const BigNumber = require("bignumber.js");
const loanStatus = require("../../../test/utils/loanStatus");
const {
  NULL_ADDRESS,
  ONE_DAY,
  toBytes32,
  toUnits,
} = require("../../../test/utils/consts");

const assertLoanValues = async (
  {loans},
  {testContext},
  {
    id,
    status = loanStatus.Closed,
    collateral = BigNumber('0'),
    principalOwed = BigNumber('0'),
    interestOwed = BigNumber('0'),
    liquidated = false,
    escrowTotalValueEth = BigNumber('0'),
    escrowTotalValueToken = BigNumber('0'),
  }
) => {
  const { artifacts } = testContext

  const loanInfo = await loans.loans(id);
  assert.strictEqual(loanInfo.id.toString(), id.toString());
  assert.strictEqual(loanInfo.status.toString(), status.toString());
  assert.strictEqual(loanInfo.collateral.toString(), collateral.toString());
  assert.strictEqual(loanInfo.principalOwed.toString(), principalOwed.toString());
  assert.strictEqual(loanInfo.interestOwed.toString(), interestOwed.toString());
  assert.strictEqual(loanInfo.liquidated, liquidated);

  const escrow = await artifacts.require('Escrow').at(loanInfo.escrow)
  const { valueInToken, valueInEth } = await escrow.calculateTotalValue();
  assert.strictEqual(valueInToken.toString(), escrowTotalValueToken.toString());
  assert.strictEqual(valueInEth.toString(), escrowTotalValueEth.toString());
};

module.exports = {
  assertLoanValues,
};
