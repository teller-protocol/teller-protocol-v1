// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Role ID used to pull funds for the asset it manages (i.e. TellerDiamond)
bytes32 constant CONTROLLER = keccak256("CONTROLLER");
// Role ID used to for accounts to call special methods that modify its state
bytes32 constant ADMIN = keccak256("ADMIN");

struct HelperConfig {
    address target;
    bytes4 selector;
}

struct HookConfig {
    Hook withdraw;
    Hook deposit;
}
struct Hook {
    // Address to send the external DELEGATECALL.
    address target;
    // Function selector to invoke when delegating.
    bytes4 selector;
    // Static data to append to the calldata when calling, like a TToken identifier.
    bytes data;
}
// Args to initialize the Teller token with
struct InitArgs {
    address controller;
    address admin;
    address underlying;
    address cToken;
    HelperConfig helperConfig;
    HookConfig hookConfig;
}
