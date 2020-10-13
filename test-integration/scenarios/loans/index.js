const _1_takeout_loan_and_2_repays_full_successfully = require('./1_takeout_loan_and_2_repays_full_successfully');
const _2_takeout_loan_and_1_repay_full_successfully = require('./2_takeout_loan_and_1_repay_full_successfully');
const _3_takeout_loan_not_enough_collateral = require('./3_takeout_loan_not_enough_collateral');
const _4_takeout_loan_and_not_withdraw_too_much_collateral = require('./4_takeout_loan_and_not_withdraw_too_much_collateral');
const _5_takeout_loan_invalid_supply_to_debt_ratio = require('./5_takeout_loan_invalid_supply_to_debt_ratio');
const _6_takeout_loan_invalid_too_short_time_request_loan_terms = require('./6_takeout_loan_invalid_too_short_time_request_loan_terms');
const _7_takeout_loan_invalid_exceeds_max_loan_amount = require('./7_takeout_loan_invalid_exceeds_max_loan_amount');
const _8_takeout_loan_invalid_borrower_address = require('./8_takeout_loan_invalid_borrower_address');
const _9_takeout_loan_invalid_exceeds_max_loan_duration = require('./9_takeout_loan_invalid_exceeds_max_loan_duration');
const _10_liquidate_loan_due_to_under_collateralized = require('./10_liquidate_loan_due_to_under_collateralized');
const _11_liquidate_loan_due_to_end_date = require('./11_liquidate_loan_due_to_end_date');
const _12_liquidate_loan_invalid_liquidation_not_needed = require('./12_liquidate_loan_invalid_liquidation_not_needed');
module.exports = {
    _1_takeout_loan_and_2_repays_full_successfully,
    _2_takeout_loan_and_1_repay_full_successfully,
    _3_takeout_loan_not_enough_collateral,
    _4_takeout_loan_and_not_withdraw_too_much_collateral,
    _5_takeout_loan_invalid_supply_to_debt_ratio,
    _6_takeout_loan_invalid_too_short_time_request_loan_terms,
    _7_takeout_loan_invalid_exceeds_max_loan_amount,
    _8_takeout_loan_invalid_borrower_address,
    _9_takeout_loan_invalid_exceeds_max_loan_duration,
    // TODO Fix after the changes in the PairAggregatorRegistry _10_liquidate_loan_due_to_under_collateralized,
    _11_liquidate_loan_due_to_end_date,
    _12_liquidate_loan_invalid_liquidation_not_needed,
};