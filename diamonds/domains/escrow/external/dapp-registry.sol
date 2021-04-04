// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { sto_DappRegistry } from "../storage/dapp-registry.sol";

abstract contract ext_DappRegistry is ext_DappRegistry_v1 {}

abstract contract ext_DappRegistry_v1 is sto_DappRegistry {
    /**
     * @notice Gets all the dapps in the registry.
     * @return an array of dapp addresses.
     */
    function getDapps() external view returns (address[] memory) {
        return dappStore().list.array;
    }
}
