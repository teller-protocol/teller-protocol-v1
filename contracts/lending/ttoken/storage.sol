// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

struct Store {
    ERC20 underlying;
    address strategy;
    uint256 totalBorrowed;
    uint256 totalRepaid;
    uint256 totalInterestRepaid;
    uint8 decimals;
    bool restricted;
}

bytes32 constant POSITION = keccak256("ttoken.storage.position");

function store() pure returns (Store storage s_) {
    bytes32 position = POSITION;
    assembly {
        s_.slot := position
    }
}
