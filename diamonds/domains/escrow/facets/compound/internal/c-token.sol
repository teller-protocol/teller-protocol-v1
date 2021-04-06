// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../../../data/escrow.sol";

abstract contract int_c_token_v1 is dat_Escrow {
    /**
       @notice Grabs the cToken address for an token from the asset settings.
       @notice The cToken underlying address must match the supplied token address.
       @param tokenAddress The token address to get the cToken for.
       @return cToken instance
    */
    function _getCToken(address tokenAddress)
        internal
        view
        returns (CErc20Interface)
    {
        return CErc20Interface(PROTOCOL.getCTokenAddress(tokenAddress));
    }
}

abstract contract int_c_token is int_c_token_v1 {}
