#!/bin/bash

echo

available_networks=('mainnet' 'rinkeby' 'kovan' 'ropsten')
local_networks=('localhost' 'hardhat')

## Exit and display help output
show_help() {
  echo "Usage: <COMMAND> [NETWORK] [PARAMS] [OPTIONS]"
  echo
  echo "Available networks:"
  echo "  ${available_networks[*]} (Use 'localhost' for testing)"
  echo
  exit 0
}

script=$1
network=$2
opts=${*:3}
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
  show_help
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

## If the script is "node" preform a network name check
if [ "$script" == "node" ]
then
  ## If starting a local hardhat rpc node the network should be a valid network
  if [ "$network" == 'hardhat' ] || [ "$network" == 'localhost' ]
  then
    echo "Should not start a local node with the hardhat network"
    echo
    show_help
  fi

  ## Verify the network name
  verify_network "$network"
  if [ -z $verify_network_return ]
  then
    echo "Must specify a non local network name"
    echo
    show_help
  fi
fi

## If network is not valid, assume "localhost" and use remaining values as options
verify_network "$network"
if [ "$verify_network_return" == '' ]
then
  opts="$network $opts"
  network='localhost'
fi

## Grab the remaining options passed in
extra_opts=''

## If the script given is "fork" preform required operations
if [ "$script" == "fork" ]
then
  if [[ " ${local_networks[*]} " == *"$network"* ]]
  then
    echo "Must specify a non local network to fork!!"
    echo
    show_help
  fi

  echo "Forking network $network..."

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
    ENV_VARS+="FORKING_BLOCK=${opts[0]} "
  elif [ -n "$latestDeploymentBlock" ]
  then
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

eval "$ENV_VARS yarn hh $script --network $network $extra_opts $opts"
