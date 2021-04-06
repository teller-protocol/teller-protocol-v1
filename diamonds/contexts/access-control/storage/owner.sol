// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract sto_AccessControl_Owner {
    bytes32 internal constant POS =
        keccak256("teller_protocol.storage.access_control.owner");

    struct AccessControlOwnerStorage {
        address owner;
    }

    function accessControlOwnerStore()
        internal
        pure
        returns (AccessControlOwnerStorage storage s)
    {
        bytes32 position = POS;

        assembly {
            s.slot := position
        }
    }
}
