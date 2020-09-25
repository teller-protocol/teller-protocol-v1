const assert = require('assert');
const BigNumber = require("bignumber.js");
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
    status,
    collateral = BigNumber('0'),
    principalOwed = BigNumber('0'),
    interestOwed = BigNumber('0'),
    liquidated = false,
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
  console.log(escrow);
};

module.exports = {
  assertClosedLoan,
};
