# Truffle Scripts

The ```./scripts``` folder contains Truffle scripts (JS files) which can be executed in any Ethereum testnet or mainnet.

## Prerequisites

Before executing any script, verify if the Zero Collateral contracts are deployed in the network where you want to execute it.

The addresses are located at ```./config/networks/NETWORK/zerocollateral.js``` where ```NETWORK``` is the network where you want to execute the scripts.

> The network names are configured in the Truffle config file. Please, see details ```./truffle-config.js``` file (section ```networks```).
> If the contracts are not defined in the network you are looking for, please contact any team member.

## Executing a Script

Once you verify the contracts are already deployed in the network, the next step is to execute it.

The command to execute a script is:

```truffle exec ./scripts/script_to_execute.js --network a_network```

Example:

```truffle exec ./scripts/loans_takeoutLoan.js --network ropsten```

Where:

- The 'ropsten' network is configured in the Truffle configuration.
