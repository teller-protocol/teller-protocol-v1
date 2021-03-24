#!/bin/bash
if [ $# -lt 1 ]
  then
    echo "Missing arguments. Execute: ./scripts/sh/steps/5_1_take_out_loans_eth.sh network sender_index amount"
    echo ""
    echo "Example: ./scripts/sh/steps/5_1_take_out_loans_eth.sh ganache 0 300"
    echo "      It will take out the last requested loan for both markets (DAI/ETH and USDC/ETH)"
    exit -1
fi

network=$1
sender_index=$2
amount=$3

echo "\n------------------------------------------------------------------------"
echo "#5: Taking out the loans (DAI and USDC / ETH)..."
echo "------------------------------------------------------------------------\n"

truffle exec ./scripts/loanManager/takeOutLastLoan.js \
    --network $network \
    --collTokenName ETH \
    --tokenName DAI \
    --senderIndex $sender_index \
    --amount $amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

truffle exec ./scripts/loanManager/takeOutLastLoan.js \
    --network $network \
    --collTokenName ETH \
    --tokenName USDC \
    --senderIndex $sender_index \
    --amount $amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi
