const { NULL_ADDRESS, TERMS_SET } = require("./consts");

const defaults = {
  id: 0,
  loanTerms: {
    borrower: NULL_ADDRESS,
    recipient: NULL_ADDRESS,
    interestRate: 0,
    collateralRatio: 0,
    maxLoanAmount: 100000000,
    duration: 7 * 60 * 60
  },
  termsExpiry: 0,
  loanStartTime: Date.now(),
  collateral: 0,
  lastCollateralIn: 0,
  principalOwed: 0,
  interestOwed: 0,
  borrowedAmount: 0,
  escrow: NULL_ADDRESS,
  status: TERMS_SET,
  userId: "0x0"
}

const collateralInfoDefaults = {
  collateral: 0,
  valueInLendingTokens: 0,
  escrowLoanValue: 0,
  neededInLendingTokens: 0, 
  neededInCollateralTokens: 0, 
  moreCollateralRequired: false, 
}

const liquidationInfoDefaults = {
  collateralInfo: collateralInfoDefaults,
  amountToLiquidate: 0, 
  rewardInCollateral: 0, 
  liquidable: false, 
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

function createLiquidationInfo(liquidationInfo = liquidationDefaults) {
  return {
    ...liquidationInfoDefaults,
    ...liquidationInfo,
    collateralInfo: {
      ...liquidationInfoDefaults.collateralInfo,
      ...(liquidationInfo.collateral || {})
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
    }
  }, createLoan(loan));
}

function encodeLiquidationParameter(web3, liquidationInfo = liquidationDefaults) {
  return web3.eth.abi.encodeParameter({
    LiquidationInfo: {
      collateralInfo: {
        collateral: "uint256", 
        valueInLendingTokens: "uint256", 
        escrowLoanValue: "uint256", 
        neededInLendingTokens: "uint256", 
        neededInCollateralTokens: "uint256",
        moreCollateralRequired: "bool",
      },
      amountToLiquidate: "uint256", 
      rewardInCollateral: "uint256", 
      liquidable: "bool", 
    }
  }, createLiquidation(liquidationInfo));
}

module.exports = {
  createLoan,
  encodeLoanParameter,
  createLiquidationInfo,
  encodeLiquidationParameter
}