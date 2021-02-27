const assert = require('assert');

const { NULL_ADDRESS, } = require("../../../test-old/utils/consts");

const assertLoanValues = async (
  {loans},
  {testContext},
  {
    id,
    status,
    collateral,
    principalOwed,
    interestOwed,
    liquidated,
    hasEscrow,
    escrowLoanValue,
  }
) => {
  const { artifacts } = testContext

  const loanInfo = await loans.loans(id);
  assert.strictEqual(loanInfo.id.toString(), id.toString(), 'Loan IDs do not match');
  if (status != null) {
    assert.strictEqual(loanInfo.status.toString(), status.toString(), 'Unexpected loan status');
  }
  if (collateral != null) {
    assert.strictEqual(loanInfo.collateral.toString(), collateral.toString(), 'Unexpected loan collateral');
  }
  if (principalOwed != null) {
    assert.strictEqual(loanInfo.principalOwed.toString(), principalOwed.toString(), 'Unexpected loan principalOwed');
  }
  if (interestOwed != null) {
    assert.strictEqual(loanInfo.interestOwed.toString(), interestOwed.toString(), 'Unexpected loan interestOwed');
  }
  if (liquidated != null) {
    assert.strictEqual(loanInfo.liquidated, liquidated, 'Unexpected loan liquidated');
  }

  if (hasEscrow != null) {
    if (hasEscrow) {
      assert(loanInfo.escrow !== NULL_ADDRESS, 'Unexpected loan escrowAddress');
    } else {
      assert(loanInfo.escrow === NULL_ADDRESS, 'Unexpected loan escrowAddress');
    }
  }

  if (loanInfo.escrow !== NULL_ADDRESS && escrowLoanValue != null) {
    const escrow = await artifacts.require('Escrow').at(loanInfo.escrow)
    const loanValue = await escrow.calculateLoanValue();
    assert.strictEqual(loanValue.toString(), escrowLoanValue.toString(), 'Unexpected loan escrow valueInToken');
  }
};

module.exports = {
  assertLoanValues,
};
