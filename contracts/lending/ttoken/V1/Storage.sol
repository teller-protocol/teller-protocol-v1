// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct Store {
    bool restricted;
}

bytes32 constant POSITION = keccak256("teller.ttoken.v1.storage.position");

function store() pure returns (Store storage s_) {
    bytes32 position = POSITION;
    assembly {
        s_.slot := position
    }
}
