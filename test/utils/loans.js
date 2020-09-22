const { NULL_ADDRESS, ACTIVE } = require("./consts");

const defaults = {
  id: 1234,
  loanTerms: {
    borrower: NULL_ADDRESS,
    recipient: NULL_ADDRESS,
    interestRate: 1,
    collateralRatio: 1,
    maxLoanAmount: 100000000,
    duration: 7 * 60 * 60
  },
  termsExpiry: 100000,
  loanStartTime: Date.now(),
  collateral: 1000000,
  lastCollateralIn: 0,
  principalOwed: 0,
  interestOwed: 0,
  borrowedAmount: 0,
  escrow: NULL_ADDRESS,
  status: ACTIVE,
  liquidated: false
}

function createLoan(loan = defaults) {
  return {
    ...defaults,
    ...loan,
    loanTerms: {
      ...defaults.loanTerms,
      ...(loan.loanTerms || {})
    }
  }
}

function encodeLoanParameter(web3, loan = defaults) {
  return web3.eth.abi.encodeParameter({
    Loan: {
      id: "uint256",
      loanTerms: {
        borrower: "address",
        recipient: "address",
        interestRate: "uint256",
        collateralRatio: "uint256",
        maxLoanAmount: "uint256",
        duration: "uint256"
      },
      termsExpiry: "uint256",
      loanStartTime: "uint256",
      collateral: "uint256",
      lastCollateralIn: "uint256",
      principalOwed: "uint256",
      interestOwed: "uint256",
      borrowedAmount: "uint256",
      escrow: "address",
      status: "uint256",
      liquidated: "bool"
    }
  }, createLoan(loan));
}

module.exports = {
  createLoan,
  encodeLoanParameter
}