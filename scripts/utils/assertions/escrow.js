const BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');

const {
  escrow: escrowEvents,
  loans: loansEvents,
} = require('../../../test/utils/events');

async function loanRepaid(
  { escrow, loans },
  { txConfig, testContext },
  { txPromise, amount, shouldFail, expectedRevertReason }
) {
  if (shouldFail) {
    await truffleAssert.reverts(txPromise, expectedRevertReason);
  } else {
    await truffleAssert.passes(txPromise);
    const repayResult = await txPromise;
    const txResult = await truffleAssert.createTransactionResult(loans, repayResult.tx);
    const loan = await escrow.getLoan.call();
    const totalOwed = new BigNumber(loan.principalOwed).plus(loan.interestOwed);
    loansEvents
      .loanRepaid(txResult)
      .emitted(
        loan.id,
        loan.loanTerms.borrower,
        amount.toString(),
        loan.escrow,
        totalOwed.toString()
      );
  }
}

async function tokensClaimed({ txPromise, recipient, shouldFail, expectedRevertReason }) {
  if (shouldFail) {
    await truffleAssert.fails(txPromise, expectedRevertReason);
  } else {
    await truffleAssert.passes(txPromise);
    const txResult = await txPromise;
    escrowEvents.tokensClaimed(txResult).emitted(recipient);
  }
}

module.exports = {
  loanRepaid,
  tokensClaimed,
};
