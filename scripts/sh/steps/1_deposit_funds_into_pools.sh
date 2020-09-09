#!/bin/bash
if [ $# -lt 4 ]
  then
    echo "Missing arguments. Execute: ./scripts/sh/steps/1_1_deposit_funds_into_pools.sh network lender_index token_name amount"
    echo ""
    echo "Example #1: ./scripts/sh/steps/1_deposit_funds_into_pools.sh ropsten 0 DAI 1000"
    echo "    The account 0-indexed will deposit 1000 DAIs into the DAI pools."
    echo ""
    echo "Example #2: ./scripts/sh/1_deposit_funds_into_pools.sh ropsten 1 USDC 500"
    echo "    The account 1-indexed will deposit 500 USDCs into the USDC pools."
    exit -1
fi

network=$1
lender_index=$2
token_name=$3
amount=$4

echo "\n------------------------------------------------------------------------"
echo "#1: Depositing funds into the DAI pools..."
echo "------------------------------------------------------------------------\n"

echo Account $lender_index is depositing $amount $token_name into $token_name / ETH pool.
truffle exec ./scripts/lendingPool/deposit.js \
    --network $network \
    --senderIndex $lender_index \
    --collTokenName ETH \
    --tokenName $token_name \
    --amount $amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

echo Account $lender_index is depositing $amount $token_name into $token_name / LINK pool.
truffle exec ./scripts/lendingPool/deposit.js \
    --network $network \
    --senderIndex $lender_index \
    --collTokenName LINK \
    --tokenName $token_name \
    --amount $amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi