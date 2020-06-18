const _1_liquidate_by_collateral = require('./1_liquidate_by_collateral');
const _2_liquidate_by_endDate = require('./2_liquidate_by_endDate');

module.exports = {
    'liquidate-loan-1-liquidate-by-collateral': _1_liquidate_by_collateral,
    'liquidate-loan-2-liquidate-by-enddate': _2_liquidate_by_endDate,
};