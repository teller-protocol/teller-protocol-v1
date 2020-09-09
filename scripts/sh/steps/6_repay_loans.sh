#!/bin/bash
if [ $# -lt 1 ]
  then
    echo "Missing arguments. Execute: ./scripts/sh/steps/6_repay_loans.sh network sender_index token_name amount"
    echo ""
    echo "Example: ./scripts/sh/steps/6_repay_loans.sh ropsten 0 DAI 50"
    echo "  It will repay 50 DAI and 50 USDC the last two loans for markets (DAI/ETH and DAI/LINK)."
    exit -1
fi

network=$1
sender_index=$2
token_name=$3
amount=$4

echo "\n------------------------------------------------------------------------"
echo "#6: Repaying loans for ETH and LINK markets..."
echo "------------------------------------------------------------------------\n"

truffle exec ./scripts/loans/repayLast.js \
    --network $network \
    --senderIndex $sender_index \
    --collTokenName ETH \
    --tokenName $token_name \
    --amount $amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

truffle exec ./scripts/loans/repayLast.js \
    --network $network \
    --senderIndex $sender_index \
    --collTokenName LINK \
    --tokenName $token_name \
    --amount $amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi