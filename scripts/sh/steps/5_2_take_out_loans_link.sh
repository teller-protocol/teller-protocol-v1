#!/bin/bash
if [ $# -lt 1 ]
  then
    echo "Missing arguments. Execute: ./scripts/sh/steps/5_2_take_out_loans_link.sh network sender_index amount"
    echo ""
    echo "Example: ./scripts/sh/steps/5_2_take_out_loans_link.sh ganache 0 300"
    echo "      It will take out the last requested loan for both markets (DAI/LINK and USDC/LINK)"
    exit -1
fi

network=$1
sender_index=$2
amount=$3

echo "\n------------------------------------------------------------------------"
echo "#5: Taking out the loans (DAI and USDC / LINK)..."
echo "------------------------------------------------------------------------\n"

truffle exec ./scripts/loans/takeOutLastLoan.js \
    --network $network \
    --collTokenName LINK \
    --tokenName DAI \
    --senderIndex $sender_index \
    --amount $amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

truffle exec ./scripts/loans/takeOutLastLoan.js \
    --network $network \
    --collTokenName LINK \
    --tokenName USDC \
    --senderIndex $sender_index \
    --amount $amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi