// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct LendingStorage {
    uint256 tmp;
}

bytes32 constant LENDING_STORAGE_POS = keccak256("teller.lending.storage");

library LendingStorageLib {
    function store() internal pure returns (LendingStorage storage s) {
        bytes32 pos = LENDING_STORAGE_POS;
        assembly {
            s.slot := pos
        }
    }
}
