#!/bin/bash

##
## @author Noah Passalacqua <noah@teller.finance>
##
## This script is for doing some preliminary checks and changes before working with a Hardhat script.
##
## It makes it easier to fork and test certain functionality easily by being able to fork a network without
##  additional setup.
##

echo

available_networks=('mainnet' 'rinkeby' 'kovan' 'ropsten')

## Exit and display help output
show_main_help() {
  echo "Usage: <COMMAND> [NETWORK] [PARAMS] [OPTIONS]"
  echo
  echo "Available networks:"
  echo "  ${available_networks[*]}"
  echo "    - NOTE: Use 'localhost' for testing once you have a local fork running"
  echo
  exit 0
}

script=$1
opts=(${*:2})
ENV_VARS=''

deployments_folder=./deployments/localhost

## Path to file that stores which network we are forking
forking_network_file=$deployments_folder/.forkingNetwork
forking_network=$(cat $forking_network_file 2>/dev/null)
if [ -n "$forking_network" ]
then
  ENV_VARS+="FORKING_NETWORK=$forking_network "
fi

latestDeploymentBlock=$(cat $deployments_folder/.latestDeploymentBlock 2>/dev/null)

## Make sure there is a script name passed
if [ -z "$script" ]
then
  echo "Hardhat script not given..."
  echo
  show_main_help
fi

## Verify that the network name given is available
verify_network() {
  verify_network_return=''

  if [ "$1" == 'localhost' ]
  then
    verify_network_return=true
  else
    for n in "${available_networks[@]}"
    do
      if [ "$n" == "$1" ]
      then
        verify_network_return=true
        break
      fi
    done
  fi
}

slice_network() {
  if [ -z "$network" ]
  then
    network="${opts[0]}"
    verify_network "$network"
    if [ -z $verify_network_return ] && [ "${1:-0}" == 'verify' ]
    then
      echo "Must specify a non local network name"
      echo
      show_main_help
    fi

    opts=("${opts[*]:1}")
  fi
}

## The "node" script is redirected to "fork" a network locally
if [ "$script" == "node" ]
then
  script='fork'
fi

## Grab the remaining options passed in
extra_opts=''

## If the script given is "fork" preform required operations
if [ "$script" == "fork" ]
then
  if [[ "${opts[0]}" =~ ^-h|--help$ ]]
  then
    echo "Usage: fork <NETWORK> [<BLOCK_NUMBER> | latest]"
    echo
    echo "  The default behavior is to fork the specified network at the last deployment block for any contracts."
    echo "  This can be overridden by ether specifying a block number OR 'latest'"
    echo
    exit
  fi

  slice_network
  if [ "$network" == 'localhost' ]
  then
    echo "Cannot fork the localhost network!"
    echo
    show_main_help
  fi

  echo -n "Forking $network... "

  ## Copy network deployments
  rm -rf "./deployments/localhost"
  cp -r "./deployments/$network" "./deployments/localhost"
  ## Set network chainId
  echo '31337' > "./deployments/localhost/.chainId"

  ## Save the forking network name for later use in hardhat.config.ts
  echo "$network" > $forking_network_file

  ## Check if there a block number was passed
  if [[ "${opts[0]}" -gt 0 ]]
  then
    echo "on block ${opts[0]}"
    ENV_VARS+="FORKING_BLOCK=${opts[0]} "
  elif [ "${opts[0]}" == 'latest' ]
  then
    echo "on the latest block"
    opts=(${opts[*]:1})
  elif [ -n "$latestDeploymentBlock" ]
  then
    echo "on the latest Teller deployment block: $latestDeploymentBlock"
    ENV_VARS+="FORKING_BLOCK=$latestDeploymentBlock "
  fi

  ## Set the actual script to be "hardhat node"
  script='node'
  ## Forking network must be "hardhat"
  network='hardhat'
  ## Since we are forking, do not redeploy
  extra_opts="$extra_opts --no-deploy"

  echo
fi

## Verify the network is correct
slice_network verify

eval "$ENV_VARS yarn hh $script --network $network $extra_opts ${opts[*]}"
