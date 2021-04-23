// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { HelperConfig, HookConfig } from "./data.sol";

struct Store {
    ICErc20 cToken;
    ERC20 underlying;
    uint8 decimals;
    bool restricted;
    HookConfig hooks;
    HelperConfig helper;
}

bytes32 constant STORE = keccak256("Teller.TToken_V1.storage.slot");

function store() pure returns (Store storage s_) {
    bytes32 position = STORE;
    assembly {
        s_.slot := position
    }
}
