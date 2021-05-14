#!/bin/bash

##
## @author Noah Passalacqua <jude@teller.finance>
##
## This script is for parsing networks to fork
##
available_networks=('mainnet' 'rinkeby' 'kovan' 'ropsten')

## Exit and display help output
show_main_help() {
  echo "Usage: yarn test:existing [NETWORK]"
  echo
  echo "Available networks:"
  echo "  ${available_networks[*]}"
  exit 0
}
script=$1

## Make sure there is a network name passed
if [[ ${available_networks[*]} =~ "$script"  ]] 
then 
    eval "yarn h fork $script"
else 
    echo "Hardhat network not given..."
    echo
    show_main_help
fi