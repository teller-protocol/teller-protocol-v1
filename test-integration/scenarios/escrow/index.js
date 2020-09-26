const _1_escrow_repay_loan_in_full = require('./1_escrow_repay_loan_in_full');
const _1_uniswap_swap_token_for_eth = require('./dapps/uniswap/1_uniswap_swap_token_for_eth')
const _2_uniswap_swap_token_for_token = require('./dapps/uniswap/2_uniswap_swap_token_for_token')

const escrow = {
  _1_escrow_repay_loan_in_full,
}

const uniswap = {
  _1_uniswap_swap_token_for_eth,
  _2_uniswap_swap_token_for_token
}

const dapps = {
  ...uniswap
}

module.exports = {
  ...escrow,
  ...dapps
}