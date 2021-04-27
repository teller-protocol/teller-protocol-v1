// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import {
    AssetPPoolLib
} from "../../../settings/asset/libraries/AssetPPoolLib.sol";

library PoolTogetherLib {
    /**
     * @notice Grabs the controlled ticket token address for the prize pool
     * @notice The pool underlying address must match the supplied token address.
     * @param tokenAddress The token address to get the cToken for.
     * @return The address of the ticket token contract.
     */
    function getTicketAddress(address tokenAddress)
        internal
        view
        returns (address)
    {
        return AssetPPoolLib.get(tokenAddress).tokens()[1];
    }
}
