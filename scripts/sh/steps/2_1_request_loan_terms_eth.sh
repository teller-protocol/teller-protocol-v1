#!/bin/bash
if [ $# -lt 6 ]
  then
    echo "Missing arguments. Execute: ./scripts/sh/steps/2_1_request_loan_terms_eth.sh network borrower_index max_loan_amount duration_days eth_collateral_amount borrower_nonce"
    echo ""
    echo "Example: ./scripts/sh/steps/2_1_request_loan_terms_eth.sh ropsten 0 2000 15 6 0"
    echo "    It will request loan terms for the borrower 0-index for 15 days with a max amount 2000 and 6 ETH as collateral (borrower nonce = 0)"
    exit -1
fi

network=$1
borrower_index=$2
max_loan_amount=$3
duration=$4
coll_amount=$5
borrower_nonce=$6

echo "------------------------------------------------------------------------"
echo "  Requesting loan terms (ETH)..."
echo "------------------------------------------------------------------------"

truffle exec ./scripts/loans/createLoanWithTerms.js \
    --network $network \
    --borrowerIndex $borrower_index \
    --tokenName DAI \
    --collTokenName ETH \
    --amount $max_loan_amount \
    --durationDays $duration \
    --collAmount $coll_amount \
    --nonce $borrower_nonce
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

borrower_nonce=$((borrower_nonce+1))
truffle exec ./scripts/loans/createLoanWithTerms.js \
    --network $network \
    --borrowerIndex $borrower_index \
    --tokenName USDC \
    --collTokenName ETH \
    --amount $max_loan_amount \
    --durationDays $duration \
    --collAmount $coll_amount \
    --nonce $borrower_nonce
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi