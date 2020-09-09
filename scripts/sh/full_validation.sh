#!/bin/bash

if [ $# -lt 2 ]
  then
    echo "Missing arguments. Execute: ./scripts/sh/full_validation.sh network initial_borrower_nonce"
    echo ""
    echo "Example: ./scripts/sh/full_validation.sh ropsten 10"
    exit -1
fi
############################################################
# This script executes the following steps to test the contracts given:
#   - A network
#   - An initial borrower nonce
# 
# Steps:
# 
# 0- It mints tokens (DAI, USDC and LINK) only on Ganache and
#    It validates the account balances.
# 1- It deposits funds into the pools (DAI/ETH, DAI/LINK, USDC/ETH and USDC/LINK).
# 2- It requests loan terms for 4 loans (one per each pool or market)
# 3- It deposits more collateral in all the loans.
# 4- It updates the platform settings (SafetyInterval) to 0 in order to able take out the loans.
# 5- It takes out all the loans.
# 6- It repays the loans for the DAI markets (DAI/ETH and DAI/LINK).
# 7- It updates (rollbacks) the platform settings (SafetyInterval) to 60.
# 
############################################################
sh_files_location=./scripts/sh/steps
zero=0

network=$1
borrower_nonce=$2
owner_account_index=0
mint_token_amount=100000
mint_token_account_index=0

required_min_dai_amount=50000
required_min_usdc_amount=50000
required_min_link_amount=3000000

dai_pools_deposit_amount=10000
usdc_pools_deposit_amount=10000

lender_dai_pools_account_index=0
lender_usdc_pools_account_index=0

borrower_eth_pool_account_index=0
borrower_link_pool_account_index=0

# Step 0
sh $sh_files_location/0_1_mint_tokens.sh $network $mint_token_account_index $mint_token_amount

# Validating lender account balances (for DAI pools).
sh $sh_files_location/0_2_require_account_balances.sh $network $lender_dai_pools_account_index $required_min_dai_amount $zero $zero
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi
# Validating lender account balances (for USDC pools).
sh $sh_files_location/0_2_require_account_balances.sh $network $lender_usdc_pools_account_index $zero $required_min_usdc_amount $zero
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi
# Validating borrower account balances (for LINK pools).
sh $sh_files_location/0_2_require_account_balances.sh $network $borrower_link_pool_account_index $zero $zero $required_min_link_amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

# Step 1
sh $sh_files_location/1_deposit_funds_into_pools.sh $network $lender_dai_pools_account_index DAI $dai_pools_deposit_amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

sh $sh_files_location/1_deposit_funds_into_pools.sh $network $lender_usdc_pools_account_index USDC $usdc_pools_deposit_amount
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

# Step 2
sh $sh_files_location/2_1_request_loan_terms_eth.sh $network $borrower_eth_pool_account_index 300 15 3 $borrower_nonce
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

sh $sh_files_location/2_2_request_loan_terms_link.sh $network $borrower_link_pool_account_index 200 10 130000 $borrower_nonce
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

# Step 3
sh $sh_files_location/3_1_deposit_more_collateral_eth.sh $network $borrower_eth_pool_account_index 0 0.5
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

sh $sh_files_location/3_2_deposit_more_collateral_link.sh $network $borrower_link_pool_account_index 0 1000000
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

# Step 4
sh $sh_files_location/update_platform_settings.sh $network $owner_account_index SafetyInterval 1
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

# Step 5
sh $sh_files_location/5_1_take_out_loans_eth.sh $network $borrower_eth_pool_account_index 250
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

sh $sh_files_location/5_2_take_out_loans_link.sh $network $borrower_link_pool_account_index 50
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

# Step 6
sh $sh_files_location/6_repay_loans.sh $network $borrower_eth_pool_account_index DAI 100
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi

# Step 7
sh $sh_files_location/update_platform_settings.sh $network $owner_account_index SafetyInterval 60
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi