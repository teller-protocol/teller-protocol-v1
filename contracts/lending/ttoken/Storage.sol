// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IStrategy } from "./interfaces/IStrategy.sol";

struct Store {
    IERC20 underlying;
    uint256 totalSupplyUnderlying;
    IStrategy strategy;
}

bytes32 constant POSITION = keccak256("teller.ttoken.base.storage.position");

function store() pure returns (Store storage s_) {
    bytes32 position = POSITION;
    assembly {
        s_.slot := position
    }
}
