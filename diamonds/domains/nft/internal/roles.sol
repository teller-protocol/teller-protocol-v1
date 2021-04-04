// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract Roles {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
}
