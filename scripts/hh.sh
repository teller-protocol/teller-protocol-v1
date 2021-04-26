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

## Helper function to run a Hardhat script
##
### Arguments:
### 1) script name
### 2) network name
### 3) script options
run() {
  eval "$ENV_VARS yarn hh $1 --network $2 $3"
}

deployments_dir=./deployments
local_deployments=$deployments_dir/localhost
chain_id_file=$local_deployments/.chainId
forking_network_file=$local_deployments/.forkingNetwork

## Get the network name we are currently forking
forking_network=$(cat $forking_network_file 2>/dev/null)
if [ -n "$forking_network" ]
then
  ENV_VARS+="FORKING_NETWORK=$forking_network "
fi

latestDeploymentBlock=$(cat $local_deployments/.latestDeploymentBlock 2>/dev/null)

## Make sure there is a script name passed
if [ -z "$script" ]
then
  echo "Hardhat script not given..."
  echo
  show_main_help
fi

get_next_opts() {
  next_opt="${opts[0]%% *}"
  if [[ -n $1 ]] && [ "$1" == 'slice' ]
  then
    slice_opts
  fi
}

slice_opts() {
  opts=(${opts[*]:1})
}

append_opts() {
  opts+=("$1")
}

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
    get_next_opts slice
    network=$next_opt
    if [ "${1:-0}" == 'verify' ]
    then
      verify_network "$network"
      if [ -z $verify_network_return ]
      then
        echo "Must specify a valid network name"
        echo
        show_main_help
      fi
    fi
  fi
}

fork() {
  if [ "$1" == 'help' ]
  then
    echo "Usage: fork <NETWORK> [<BLOCK_NUMBER> | latest]"
    echo
    echo "  The default behavior is to fork the specified network at the last deployment block for any contracts."
    echo "  This can be overridden by ether specifying a block number OR 'latest'"
    echo
    exit 0

  elif [ "$1" == 'stop' ]
  then
    fork_pid=$(lsof -ti :8545)
    if [[ -n $fork_pid ]]
    then
      kill "$fork_pid"
      echo "Forked network stopped"
    else
      echo "No fork running"
    fi
    echo
    return 0
  fi

  local network=$1
  shift
  local block=$1
  shift

  verify_network "$network"
  if [ "$network" == 'localhost' ]
  then
    echo "Cannot fork the localhost network!"
    echo
    show_main_help
  fi

  echo -n "Forking $network... "

  ## Copy network deployments
  rm -rf $local_deployments
  cp -r $deployments_dir/"$network" $local_deployments
  ## Set network chainId (default is 31337)
  echo '31337' > $chain_id_file

  ## Save the forking network name for later use in hardhat.config.ts
  echo "$network" > $forking_network_file

  ## Check if there a block number was passed
  if [[ $block -gt 0 ]]
  then
    echo "on block $block"
    ENV_VARS+="FORKING_BLOCK=$block "
  elif [ "$block" == 'latest' ]
  then
    echo "on the latest block"
  elif [ -n "$latestDeploymentBlock" ]
  then
    unset block
    echo "on the latest Teller deployment block: $latestDeploymentBlock"
    ENV_VARS+="FORKING_BLOCK=$latestDeploymentBlock "
  fi
  echo

  ## Run the Hardhat "node" script on "hardhat" network
  start() {
    ## Since we are forking, do not redeploy
    run node hardhat "--no-deploy"
  }

  ## Optional param to run fork in the background
  if [ "$1" == "bg" ]
  then
    start 1> /dev/null &

    while ! nc -z localhost 8545; do
      sleep 0.1
    done

    echo " || Fork running in the background (PID $!) ||"
    echo
  else
    start
  fi
}

try_fork() {
  network=$1
  block=$2

  verify_network "$network"

  fork_pid=$(lsof -ti :8545)
  if [[ -z $fork_pid ]]
  then
    fork "$network" "$block" bg
  fi
}

fork_notice() {
  echo
  echo "NOTICE: Local $forking_network fork still running..."
  echo
}

deploy() {
  local network=$1
  shift
  local live=$1

  if [ "$live" == 'live' ]
  then
    ## Remove from args
    shift
  elif [ "$network" != "localhost" ]
  then
    echo "Must append \"live\" to the script options to deploy on mainnet!!"
    echo
    exit 0
  fi

  ## Deploy on network
  run deploy "$network" "$*"

  if [ "$network" == "localhost" ]
  then
     fork_notice
  fi
}

if [ "$script" == 'deploy' ]
then
  get_next_opts
  if [ "$next_opt" == 'fork' ]
  then
    ## Slice "fork" from opts
    slice_opts
    ## Next value should be a valid network name
    slice_network verify
    ## Try to fork it
    try_fork "$network" latest

    ## Deploy on the local forked network
    deploy localhost ${opts[*]}

  else
    ## Get the network name
    slice_network verify
    ## Deploy
    deploy "$network" ${opts[*]}
  fi

elif [ "$script" == 'test' ]
then
  ## If a fork is already running, stop it
  fork stop 1>/dev/null
  try_fork mainnet

  run test hardhat ${opts[*]}

  fork stop

elif [ "$script" == 'fork' ] || [ "$script" == 'node' ]
then
  get_next_opts
  if [[ $next_opt =~ ^-h|--help$ ]]
  then
    fork help
  elif [ "$next_opt" == "stop" ]
  then
    fork stop
  else
    slice_network verify
    fork "$network" ${opts[*]}
  fi

else
  ## Script not supported, show help
#  show_main_help

  slice_network verify
  run "$script" "$network" "${opts[*]}"
fi
