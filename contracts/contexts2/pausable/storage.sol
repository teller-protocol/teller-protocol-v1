// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct PausableStorage {
    mapping(bytes32 => bool) paused;
}

bytes32 constant PAUSABLE_POS = keccak256("teller.pausable.storage");

library PausableStorageLib {
    function store() internal pure returns (PausableStorage storage s) {
        bytes32 pos = PAUSABLE_POS;
        assembly {
            s.slot := pos
        }
    }
}
