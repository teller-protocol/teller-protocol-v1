const assert = require('assert');
const {
  NULL_ADDRESS,
} = require("../../../test/utils/consts");

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
    escrowTotalValueEth,
    escrowTotalValueToken,
  }
) => {
  const { artifacts } = testContext

  const loanInfo = await loans.loans(id);
  assert.strictEqual(loanInfo.id.toString(), id.toString());
  if (status != null) {
    assert.strictEqual(loanInfo.status.toString(), status.toString());
  }
  if (collateral != null) {
    assert.strictEqual(loanInfo.collateral.toString(), collateral.toString());
  }
  if (principalOwed != null) {
    assert.strictEqual(loanInfo.principalOwed.toString(), principalOwed.toString());
  }
  if (interestOwed != null) {
    assert.strictEqual(loanInfo.interestOwed.toString(), interestOwed.toString());
  }
  if (liquidated != null) {
    assert.strictEqual(loanInfo.liquidated, liquidated);
  }

  if (loanInfo.escrow !== NULL_ADDRESS) {
    const escrow = await artifacts.require('Escrow').at(loanInfo.escrow)
    const { valueInToken, valueInEth } = await escrow.calculateTotalValue();
    if (escrowTotalValueToken != null) {
      assert.strictEqual(valueInToken.toString(), escrowTotalValueToken.toString());
    }
    if (escrowTotalValueEth != null) {
      assert.strictEqual(valueInEth.toString(), escrowTotalValueEth.toString());
    }
  }
};

module.exports = {
  assertLoanValues,
};
