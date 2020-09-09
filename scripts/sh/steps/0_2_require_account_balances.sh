#!/bin/bash
if [ $# -lt 4 ]
  then
    echo "Missing arguments. Execute: ./scripts/sh/steps/0_2_require_account_balances.sh network account_index min_dai_amount min_usdc_amount min_link_amount"
    echo ""
    echo "Example: ./scripts/sh/steps/0_2_require_account_balances.sh ropsten 0 DAI 1000 2000 3000"
    echo "  It will validate the account 0-index have at least 1000 DAIs, 2000 USDCs and 3000 LINKs as balances."
    exit -1
fi

network=$1
account_index=$2
min_dai_amount=$3
min_usdc_amount=$4
min_link_amount=$5

echo "\n------------------------------------------------------------------------"
echo "#0: Require token balances..."
echo "------------------------------------------------------------------------\n"

if [ \( $min_dai_amount -gt 0 \) ]
then
  echo Validating account $account_index token DAI balance. Min balance required: $min_dai_amount
  truffle exec ./scripts/tokens/requireBalanceOf.js \
      --network $network \
      --accountIndex $account_index \
      --tokenName DAI \
      --minAmount $min_dai_amount
  if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
  then
    echo "Process finished with errors."
    exit -1
  fi
fi

if [ \( $min_usdc_amount -gt 0 \) ]
then
  echo Validating account $account_index token USDC balance. Min balance required: $min_usdc_amount
  truffle exec ./scripts/tokens/requireBalanceOf.js \
      --network $network \
      --accountIndex $account_index \
      --tokenName USDC \
      --minAmount $min_usdc_amount
  if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
  then
    echo "Process finished with errors."
    exit -1
  fi
fi

if [ \( $min_link_amount -gt 0 \) ]
then
  echo Validating account $account_index token lINK balance. Min balance required: $min_link_amount
  truffle exec ./scripts/tokens/requireBalanceOf.js \
      --network $network \
      --accountIndex $account_index \
      --tokenName LINK \
      --minAmount $min_link_amount
  if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
  then
    echo "Process finished with errors."
    exit -1
  fi
fi