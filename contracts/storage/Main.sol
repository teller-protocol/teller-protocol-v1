// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library s_Main {
    struct Layout {
        mapping(address => bool) whitelisted;
    }

    bytes32 public constant STORAGE_POSITION =
        keccak256("teller_protocol.storage.main");

    function get() internal pure returns (Layout storage l_) {
        bytes32 position = STORAGE_POSITION;

        assembly {
            l_.slot := position
        }
    }
}
