// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ICErc20 } from "../../../../shared/interfaces/ICErc20.sol";

struct Store {
    ICErc20 cToken;
    uint16 balanceRatioMax;
    uint16 balanceRatioMin;
}

bytes32 constant POSITION = keccak256(
    "ttoken.strategy.compound.storage.position"
);

function store() pure returns (Store storage s_) {
    bytes32 position = POSITION;
    assembly {
        s_.slot := position
    }
}
