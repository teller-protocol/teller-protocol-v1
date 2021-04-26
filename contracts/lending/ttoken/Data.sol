// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Role ID used to pull funds for the asset it manages (i.e. TellerDiamond)
bytes32 constant CONTROLLER = keccak256("CONTROLLER");
// Role ID used to for accounts to call special methods that modify its state
bytes32 constant ADMIN = keccak256("ADMIN");

bytes32 constant TELLER_TTOKEN_STRATEGY_SALT = keccak256(
    "teller.ttoken.strategy.salt"
);

// Args to initialize the Teller token with
struct InitArgs {
    address controller;
    address admin;
    address underlying;
    address cToken;
}

uint256 constant EXCHANGE_RATE_FACTOR = 1e18;
uint256 constant ONE_HUNDRED_PERCENT = 10000;
