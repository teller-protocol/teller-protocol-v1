// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library sto_Pausable {
    struct PausableLayout {
        mapping(address => bool) paused;
    }

    bytes32 internal constant PAUSABLE_STORAGE_POSITION =
        keccak256(abi.encode("teller_protocol.context.pausable"));

    function pausableStorage()
        internal
        pure
        returns (PausableLayout storage l_)
    {
        bytes32 position = PAUSABLE_STORAGE_POSITION;

        assembly {
            l_.slot := position
        }
    }
}
