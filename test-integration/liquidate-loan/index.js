const _1_liquidate_eth_by_collateral = require('./1_liquidate_eth_by_collateral');
const _2_liquidate_eth_by_endDate = require('./2_liquidate_eth_by_endDate');

module.exports = {
    'liquidate-loan-1-liquidate-eth-by-collateral': _1_liquidate_eth_by_collateral,
    'liquidate-loan-2-liquidate-eth-by-enddate': _2_liquidate_eth_by_endDate,
};