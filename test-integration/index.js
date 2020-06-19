const allLendingPoolDeposit = require('./deposit-lending-pool');
const allLiquidateLoan = require('./liquidate-loan');
const allDepositCollateral = require('./deposit-collateral');

module.exports = {
    'lending-pool-deposit': allLendingPoolDeposit,
    'liquidate-loan': allLiquidateLoan,
    'deposit-collateral': allDepositCollateral,
};