// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract sto_Pausable_v1 {
    struct PausableLayout {
        mapping(address => bool) paused;
    }

    bytes32 internal constant PAUSABLE_STORAGE_POSITION =
        keccak256(abi.encode("teller_protocol.context.pausable.v1"));

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

abstract contract sto_Pausable is sto_Pausable_v1 {}
