// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Role ID used to pull funds for the asset it manages (i.e. TellerDiamond)
bytes32 constant CONTROLLER = keccak256("CONTROLLER");
// Role ID used to for accounts to call special methods that modify its state
bytes32 constant ADMIN = keccak256("ADMIN");

// Args to initialize the Teller token with
struct InitArgs {
    address controller;
    address underlying;
    address cToken;
    uint256 maxTVL;
}
