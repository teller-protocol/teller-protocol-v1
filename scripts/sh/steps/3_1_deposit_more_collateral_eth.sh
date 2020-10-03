#!/bin/bash
if [ $# -lt 1 ]
  then
    echo "Missing arguments. Execute: ./scripts/sh/steps/3_1_deposit_more_collateral_eth.sh network borrower_index sender_index token_name eth_collateral_amount"
    echo ""
    echo "Example: ./scripts/sh/steps/3_1_deposit_more_collateral_eth.sh ropsten 0 0 2.1"
    echo "      It will deposit more (2.1 ETH) collateral for the last requested loan (for DAI and USDC) where the borrower and sender are the accounts 0-index."
    exit -1
fi

network=$1
borrower_index=$2
sender_index=$3
collateral_amount=$4
echo "\n------------------------------------------------------------------------"
echo "#3: Depositing more collateral (for ETH loans)..."
echo "------------------------------------------------------------------------\n"

truffle exec ./scripts/loans/depositCollateralLast.js \
    --network $network \
    --borrowerIndex $borrower_index \
    --senderIndex $sender_index \
    --tokenName DAI \
    --collTokenName ETH \
    --amount $collateral_amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

truffle exec ./scripts/loans/depositCollateralLast.js \
    --network $network \
    --borrowerIndex $borrower_index \
    --senderIndex $sender_index \
    --tokenName USDC \
    --collTokenName ETH \
    --amount $collateral_amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi