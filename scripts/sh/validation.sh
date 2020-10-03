#!/bin/bash
echo "Initializing parameters..."
if [ $# -lt 1 ]
  then
    echo "Missing arguments. Execute: ./validation.sh network"
    echo "Example: ./validation.sh ropsten"
    exit -1
fi

network=$1
platform_setting_initial_safety_interval=60
platform_setting_reset_safety_interval=0
################################################
# Lenders Parameters
################################################
# Market: DAI / ETH => Amount: 1000 DAI
# Market: USDC / ETH => Amount: 1000 USDC
# Market: DAI / LINK => Amount: 1000 DAI
# Market: USDC / LINK => Amount: 1000 USDC
################################################
lender_dai_eth_sender_index=0
lender_dai_eth_amount=1000
lender_usdc_eth_sender_index=0
lender_usdc_eth_amount=1000
lender_dai_link_sender_index=0
lender_dai_link_amount=1000
lender_usdc_link_sender_index=0
lender_usdc_link_amount=1000

################################
# LOAN Parameters
################################
loan_1_dai_eth_duration=5
loan_1_dai_eth_mint_loan_amount=200
loan_1_dai_eth_max_loan_amount=300
loan_1_dai_eth_borrower_index=1
loan_1_dai_eth_sender_index=1
loan_1_dai_eth_borrower_nonce=4
loan_1_dai_eth_coll_amount=0.6
loan_1_dai_eth_loan_amount=100
loan_1_dai_eth_repay_1=0

loan_2_usdc_eth_duration=2
loan_2_usdc_eth_mint_loan_amount=200
loan_2_usdc_eth_max_loan_amount=250
loan_2_usdc_eth_borrower_index=1
loan_2_usdc_eth_sender_index=1
loan_2_usdc_eth_borrower_nonce=3
loan_2_usdc_eth_coll_amount=0.8
loan_2_usdc_eth_coll_amount_2=0.2
loan_2_usdc_eth_loan_amount=100
loan_2_usdc_eth_repay_1=40
loan_2_usdc_eth_repay_2=50
loan_2_usdc_eth_repay_3=0

echo "\n------------------------------------------------------------------------"
echo "#0: Minting tokens..."
echo "------------------------------------------------------------------------\n"

truffle exec ./scripts/tokens/mint.js \
    --network $network \
    --receiverIndex $loan_1_dai_eth_borrower_index \
    --tokenName DAI \
    --amount $loan_1_dai_eth_mint_loan_amount

truffle exec ./scripts/tokens/mint.js \
    --network $network \
    --receiverIndex $loan_2_usdc_eth_borrower_index \
    --tokenName USDC \
    --amount $loan_2_usdc_eth_mint_loan_amount

echo "\n------------------------------------------------------------------------"
echo "#1: Depositing funds into the pools..."
echo "------------------------------------------------------------------------\n"
truffle exec ./scripts/lendingPool/deposit.js \
    --network $network \
    --senderIndex $lender_dai_eth_sender_index \
    --collTokenName ETH \
    --tokenName DAI \
    --amount $lender_dai_eth_amount

truffle exec ./scripts/lendingPool/deposit.js \
    --network $network \
    --senderIndex $lender_usdc_eth_sender_index \
    --collTokenName ETH \
    --tokenName USDC \
    --amount $lender_usdc_eth_amount


#truffle exec ./scripts/lendingPool/deposit.js \
#    --network $network \
#    --senderIndex $lenderIndex \
#    --collTokenName LINK \
#    --tokenName DAI \
#    --amount $lendAmount
#
#truffle exec ./scripts/lendingPool/deposit.js
#    --network $network \
#    --senderIndex $lenderIndex \
#    --collTokenName LINK \
#    --tokenName USDC \
#    --amount $lendAmount

echo "\n------------------------------------------------------------------------"
echo "#2: Requesting loan terms..."
echo "------------------------------------------------------------------------\n"

truffle exec ./scripts/loans/createLoanWithTerms.js \
    --network $network \
    --borrowerIndex $loan_1_dai_eth_borrower_index \
    --tokenName DAI \
    --collTokenName ETH \
    --amount $loan_1_dai_eth_max_loan_amount \
    --durationDays $loan_1_dai_eth_duration \
    --collAmount $loan_1_dai_eth_coll_amount \
    --nonce $loan_1_dai_eth_borrower_nonce

truffle exec ./scripts/loans/createLoanWithTerms.js \
    --network $network \
    --borrowerIndex $loan_2_usdc_eth_borrower_index \
    --tokenName USDC \
    --collTokenName ETH \
    --amount $loan_2_usdc_eth_max_loan_amount \
    --durationDays $loan_2_usdc_eth_duration \
    --collAmount $loan_2_usdc_eth_coll_amount \
    --nonce $loan_2_usdc_eth_borrower_nonce

echo "\n------------------------------------------------------------------------"
echo "#3: Depositing more collateral (for some loans)..."
echo "------------------------------------------------------------------------\n"

truffle exec ./scripts/loans/depositCollateralLast.js \
    --network $network \
    --borrowerIndex $loan_2_usdc_eth_borrower_index \
    --senderIndex $loan_2_usdc_eth_sender_index \
    --tokenName USDC \
    --collTokenName ETH \
    --amount $loan_2_usdc_eth_coll_amount_2

echo "\n------------------------------------------------------------------------"
echo "#4: Updating platform settings..."
echo "------------------------------------------------------------------------\n"

truffle exec ./scripts/settings/updatePlatformSetting.js \
    --network $network \
    --senderIndex 0 \
    --settingName SafetyInterval \
    --newValue $platform_setting_reset_safety_interval

echo "\n------------------------------------------------------------------------"
echo "#5: Taking out the loans..."
echo "------------------------------------------------------------------------\n"

truffle exec ./scripts/loans/takeOutLastLoan.js \
    --network $network \
    --collTokenName ETH \
    --tokenName DAI \
    --senderIndex $loan_1_dai_eth_borrower_index \
    --amount $loan_1_dai_eth_loan_amount

echo "\n------------------------------------------------------------------------"
echo "#6: Repaying some loans (#1 repay)..."
echo "------------------------------------------------------------------------\n"

truffle exec ./scripts/loans/repayLast.js \
    --network $network \
    --senderIndex $loan_1_dai_eth_borrower_index \
    --collTokenName ETH \
    --tokenName DAI \
    --amount $loan_1_dai_eth_repay_1

echo "\n------------------------------------------------------------------------"
echo "#7: Repaying some loans (#2 repay)..."
echo "------------------------------------------------------------------------\n"



echo "\n------------------------------------------------------------------------"
echo "#8: Rollback platform settings..."
echo "------------------------------------------------------------------------\n"

truffle exec ./scripts/settings/updatePlatformSetting.js \
    --network $network \
    --senderIndex 0 \
    --settingName SafetyInterval \
    --newValue $platform_setting_initial_safety_interval