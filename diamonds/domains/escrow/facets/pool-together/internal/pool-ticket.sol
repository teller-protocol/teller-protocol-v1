// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./p-pool.sol";

abstract contract int_pool_ticket_v1 is int_p_pool {
    /**
        @notice Grabs the controlled ticket token address for the prize pool
        @notice The pool underlying address must match the supplied token address.
        @param tokenAddress The token address to get the cToken for.
        @return The address of the ticket token contract.
    */
    function _getTicketAddress(address tokenAddress)
        internal
        view
        returns (address)
    {
        return _getPrizePool(tokenAddress).tokens()[1];
    }
}

abstract contract int_pool_ticket is int_pool_ticket_v1 {}
