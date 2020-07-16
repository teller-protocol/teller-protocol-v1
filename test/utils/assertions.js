const assertLoanTerms = (loanTerms, expectedLoanTermsData) => {
    assert.equal(loanTerms.borrower.toString(), expectedLoanTermsData.borrower);
    assert.equal(loanTerms.recipient.toString(), expectedLoanTermsData.recipient);
    assert.equal(loanTerms.interestRate.toString(), expectedLoanTermsData.interestRate);
    assert.equal(loanTerms.collateralRatio.toString(), expectedLoanTermsData.collateralRatio);
    assert.equal(loanTerms.maxLoanAmount.toString(), expectedLoanTermsData.maxLoanAmount);
    assert.equal(loanTerms.duration.toString(), expectedLoanTermsData.duration);
}

const assertLoan = (loan, expectedLoanData) => {
    assertLoanTerms(loan.loanTerms, expectedLoanData.loanTerms);
    assert.equal(loan.id.toString(), expectedLoanData.id.toString());
    assert.equal(loan.termsExpiry.toString(), expectedLoanData.termsExpiry);
    assert.equal(loan.loanStartTime.toString(), expectedLoanData.loanStartTime);
    assert.equal(loan.collateral.toString(), expectedLoanData.collateral);
    assert.equal(loan.lastCollateralIn.toString(), expectedLoanData.lastCollateralIn);
    assert.equal(loan.principalOwed.toString(), expectedLoanData.principalOwed);
    assert.equal(loan.interestOwed.toString(), expectedLoanData.interestOwed);
    assert.equal(loan.status.toString(), expectedLoanData.status);
    assert.equal(loan.liquidated, expectedLoanData.liquidated);
};

module.exports = {
    assertLoanTerms,
    assertLoan,
}