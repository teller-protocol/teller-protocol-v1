// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract Roles {
    bytes32 internal constant ADMIN = keccak256("BIG_DAWG");
    bytes32 internal constant PAUSER = keccak256("PAUSER");
    bytes32 internal constant USER = keccak256("USER");
}
