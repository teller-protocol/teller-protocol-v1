#!/bin/bash
if [ $# -lt 1 ]
  then
    echo "Missing arguments. Execute: ./scripts/sh/steps/3_2_deposit_more_collateral_link.sh network borrower_index sender_index token_name link_collateral_amount"
    echo ""
    echo "Example: ./scripts/sh/steps/3_2_deposit_more_collateral_link.sh ropsten 0 0 2.1"
    echo "      It will deposit more (2.1 LINK) collateral for the last requested loan (for DAI and USDC) where the borrower and sender are the accounts 0-index."
    exit -1
fi

network=$1
borrower_index=$2
sender_index=$3
collateral_amount=$4
echo "\n------------------------------------------------------------------------"
echo "#3: Depositing more collateral (for LINK loans)..."
echo "------------------------------------------------------------------------\n"

truffle exec ./scripts/loanManager/depositCollateralLast.js \
    --network $network \
    --borrowerIndex $borrower_index \
    --senderIndex $sender_index \
    --tokenName DAI \
    --collTokenName LINK \
    --amount $collateral_amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

truffle exec ./scripts/loanManager/depositCollateralLast.js \
    --network $network \
    --borrowerIndex $borrower_index \
    --senderIndex $sender_index \
    --tokenName USDC \
    --collTokenName LINK \
    --amount $collateral_amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi
