// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./data.sol";

contract sto_AccessControl {
    struct AccessControlLayout {
        mapping(bytes32 => RoleData) roles;
        bool notEntered;
    }

    function accessControl()
        internal
        pure
        returns (AccessControlLayout storage l_)
    {
        bytes32 position = keccak256("teller_protocol.storage.access_control");

        assembly {
            l_.slot := position
        }
    }
}
