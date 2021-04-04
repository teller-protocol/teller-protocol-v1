// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/dapp-registry.sol";

abstract contract int_DappRegistry_v1 is sto_DappRegistry_v1 {
    /**
     * @notice Gets all the dapps in the registry.
     * @return an array of dapp addresses.
     */
    function getDapps() external view returns (address[] memory) {
        return dappStore().list.array;
    }
}
