// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library LibCompound {
    // Compound error code for no errors
    uint256 constant NO_ERROR = 0;

    // Compound error code when caller does not have sufficient balance in the ERC-20 contract to complete the desired action.
    uint256 constant TOKEN_INSUFFICIENT_BALANCE = 13;
}
