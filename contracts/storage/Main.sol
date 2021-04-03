// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library MainStorage {
    struct S {
        mapping(address => bool) whitelisted;
    }

    bytes32 public constant STORAGE_POSITION =
        keccak256("teller_protocol.storage.main");

    function s() internal pure returns (S storage s_) {
        bytes32 position = STORAGE_POSITION;

        assembly {
            s_.slot := position
        }
    }
}
