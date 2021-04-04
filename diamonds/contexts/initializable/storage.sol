// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract sto_Initializable_v1 {
    struct InitializableLayout {
        bool initialized;
    }

    bytes32 internal constant INITIALIZABLE_STORAGE_POSITION =
        keccak256(abi.encode("teller_protocol.context.initializable.v1"));

    function initializableStorage()
        internal
        pure
        returns (InitializableLayout storage l_)
    {
        bytes32 position = INITIALIZABLE_STORAGE_POSITION;

        assembly {
            l_.slot := position
        }
    }
}

abstract contract sto_Initializable is sto_Initializable_v1 {}
