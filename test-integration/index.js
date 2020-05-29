const allLendingPoolDeposit = require('./lending-pool-deposit');
const allLiquidateLoan = require('./liquidate-loan');

module.exports = {
    'lending-pool-deposit': allLendingPoolDeposit,
    'liquidate-loan': allLiquidateLoan,
};