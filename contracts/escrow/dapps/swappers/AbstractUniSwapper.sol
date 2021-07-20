// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { AbstractSwapper } from "./AbstractSwapper.sol";

abstract contract AbstractUniSwapper is AbstractSwapper {
    /**
     * @dev The address of the swapping router on the deployed network
     * @dev example - contract address on L1 mainnet or L2 polygon mainnet
     */
    address internal immutable ROUTER_ADDRESS;

    /**
     * @notice Sets the swapping router address on protocol deployment.
     * @param routerAddress The address of the swapping router contract on the network.
     */
    constructor(address routerAddress) {
        ROUTER_ADDRESS = routerAddress;
    }
}
