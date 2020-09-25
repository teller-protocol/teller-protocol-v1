const assert = require('assert');
const BigNumber = require("bignumber.js");
const loanStatus = require("../../../test/utils/loanStatus");
const { loans: loansActions } = require('../actions');
const {
  NULL_ADDRESS,
  ONE_DAY,
  toBytes32,
  toUnits,
} = require("../../../test/utils/consts");

const assertClosedLoan = async (
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
  const loanInfo = await loans.loans(id);
  assert.equal(loanInfo.id.toString(), id.toString());
  assert.equal(loanInfo.status.toString(), status.toString());
  assert.equal(loanInfo.collateral.toString(), collateral.toString());
  assert.equal(loanInfo.principalOwed.toString(), principalOwed.toString());
  assert.equal(loanInfo.interestOwed.toString(), interestOwed.toString());
  assert.equal(loanInfo.liquidated, liquidated);

  const escrow = await loansActions.getEscrow({loans}, {testContext}, {loanId: id});
  const {
    valueInToken,
    valueInEth,
  } = await escrow.calculateTotalValue();
  assert.equal(valueInToken.toString(), escrowTotalValueToken.toString());
  assert.equal(valueInEth.toString(), escrowTotalValueEth.toString());
};

module.exports = {
  assertClosedLoan,
};
