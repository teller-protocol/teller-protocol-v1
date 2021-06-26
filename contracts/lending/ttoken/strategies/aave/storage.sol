// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IAToken } from "../../../../shared/interfaces/IAToken.sol";

struct Store {
    IAToken aToken;
    uint16 balanceRatioMax;
    uint16 balanceRatioMin;
}

bytes32 constant POSITION = keccak256("ttoken.strategy.aave.storage.position");

function store() pure returns (Store storage s_) {
    bytes32 position = POSITION;
    assembly {
        s_.slot := position
    }
}
