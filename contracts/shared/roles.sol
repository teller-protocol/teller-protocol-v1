// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev the roles for the user to assign, revoke and check in functions
 */
bytes32 constant ADMIN = keccak256("ADMIN");
bytes32 constant PAUSER = keccak256("PAUSER");
