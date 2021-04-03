// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

library s_Domain {
    struct Layout {
        ;
    }

    bytes32 internal constant POSITION =
        keccak256("teller_protocol.storage.domain.standard");

    function get() internal pure returns (Layout storage l_) {
        bytes32 position = POSITION;

        assembly {
            l_.slot := position
        }
    }
}
