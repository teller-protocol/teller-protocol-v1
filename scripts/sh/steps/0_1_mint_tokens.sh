#!/bin/bash
if [ $# -lt 3 ]
  then
    echo "Missing arguments. Execute: ./scripts/sh/steps/0_1_mint_tokens.sh network receiver_index amount"
    echo ""
    echo "Example: ./scripts/sh/steps/0_1_mint_tokens.sh ropsten 0 1000"
    echo "  The account 0-index will receive 1000 DAIs and 1000 USDCs"
    exit -1
fi

network=$1
receiver_index=$2
amount=$3

echo "\n------------------------------------------------------------------------"
echo "#0: Minting tokens..."
echo "------------------------------------------------------------------------\n"

if [ $network != "ganache" ]
  then
    echo ""
    echo Network $network does not support mintable tokens. This step will be skipped.
    echo ""
    exit 0
fi

echo Account $receiver_index index will receive $amount DAIs
truffle exec ./scripts/tokens/mint.js \
    --network $network \
    --receiverIndex $receiver_index \
    --tokenName DAI \
    --amount $amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

echo Account $receiver_index index will receive $amount USDCs
truffle exec ./scripts/tokens/mint.js \
    --network $network \
    --receiverIndex $receiver_index \
    --tokenName USDC \
    --amount $amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

echo Account $receiver_index index will receive $amount LINKs
truffle exec ./scripts/tokens/mint.js \
    --network $network \
    --receiverIndex $receiver_index \
    --tokenName LINK \
    --amount $amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi
