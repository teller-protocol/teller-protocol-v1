const assertLoanTerms = (loanTerms, expectedLoanTermsData) => {
    assert.equal(loanTerms.borrower.toString(), expectedLoanTermsData.borrower, "Borrower incorrect");
    assert.equal(loanTerms.recipient.toString(), expectedLoanTermsData.recipient, "Recipient incorrect");
    assert.equal(loanTerms.interestRate.toString(), expectedLoanTermsData.interestRate, "Interest rate incorrect");
    assert.equal(loanTerms.collateralRatio.toString(), expectedLoanTermsData.collateralRatio, "Collateral ratio incorrect");
    assert.equal(loanTerms.maxLoanAmount.toString(), expectedLoanTermsData.maxLoanAmount, "Max loan amount incorrect");
    assert.equal(loanTerms.duration.toString(), expectedLoanTermsData.duration, "Duration incorrect");
}

const assertLoan = (loan, expectedLoanData) => {
    assertLoanTerms(loan.loanTerms, expectedLoanData.loanTerms);
    assert.equal(loan.id.toString(), expectedLoanData.id.toString(), "ID incorrect");
    assert.equal(loan.termsExpiry.toString(), expectedLoanData.termsExpiry, "Terms expiry incorrect");
    assert.equal(loan.loanStartTime.toString(), expectedLoanData.loanStartTime, "Loan start time incorrect");
    assert.equal(loan.collateral.toString(), expectedLoanData.collateral, "Collateral amount incorrect");
    assert.equal(loan.lastCollateralIn.toString(), expectedLoanData.lastCollateralIn, "Last collateral in incorrect");
    assert.equal(loan.principalOwed.toString(), expectedLoanData.principalOwed, "Principal owed incorrect");
    assert.equal(loan.interestOwed.toString(), expectedLoanData.interestOwed, "Interest owed incorrect");
    assert.equal(loan.status.toString(), expectedLoanData.status, "Status incorrect");
    assert.equal(loan.liquidated, expectedLoanData.liquidated, "Liquidated incorrect");
};

module.exports = {
    assertLoanTerms,
    assertLoan,
}