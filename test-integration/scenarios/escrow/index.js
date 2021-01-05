const _1_escrow_repay_loan_in_full = require('./1_escrow_repay_loan_in_full');
const _2_escrow_error_repaying_loan_as_not_borrower = require('./2_escrow_error_repaying_loan_as_not_borrower')
const _3_escrow_claim_tokens_after_loan_closed = require('./3_escrow_claim_tokens_after_loan_closed')
const _4_escrow_error_claim_tokens_before_loan_closed = require('./4_escrow_error_claim_tokens_before_loan_closed')
const _5_escrow_error_claim_tokens_as_not_borrower_loan_not_liquidated = require('./5_escrow_error_claim_tokens_as_not_borrower_loan_not_liquidated')

const _1_compound_lend_token = require('./dapps/compound/1_compound_lend_token')
const _2_compound_redeem_token = require('./dapps/compound/2_compound_redeem_token')
const _3_compound_redeem_all_token = require('./dapps/compound/3_compound_redeem_all_token')
const _4_compound_redeem_token_insufficient_balance = require('./dapps/compound/4_compound_redeem_token_insufficient_balance')

const _1_uniswap_secured_swap_token_for_token = require('./dapps/uniswap/1_uniswap_secured_swap_token_for_token')
const _2_uniswap_secured_swap_token_for_token_gt_balance = require('./dapps/uniswap/2_uniswap_secured_swap_token_for_token_gt_balance')
const _3_uniswap_unsecured_swap = require('./dapps/uniswap/3_uniswap_unsecured_swap')

const escrow = {
  _1_escrow_repay_loan_in_full,
  _2_escrow_error_repaying_loan_as_not_borrower,
  _3_escrow_claim_tokens_after_loan_closed,
  _4_escrow_error_claim_tokens_before_loan_closed,
  _5_escrow_error_claim_tokens_as_not_borrower_loan_not_liquidated,
}

const compound = {
  _1_compound_lend_token,
  _2_compound_redeem_token,
  _3_compound_redeem_all_token,
  _4_compound_redeem_token_insufficient_balance,
}

const uniswap = {
  _1_uniswap_secured_swap_token_for_token,
  _2_uniswap_secured_swap_token_for_token_gt_balance,
  _3_uniswap_unsecured_swap,
}

const dapps = {
  ...compound,
  ...uniswap,
}

module.exports = {
  ...escrow,
  ...dapps
}