// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./data.sol";

abstract contract sto_AccessControl_v1 {
    bytes32 internal constant POSITION_V1 =
        keccak256("teller_protocol.storage.asset_settings.v1");

    struct AccessControlLayout_v1 {
        mapping(bytes32 => dat_AccessControl_v1.RoleData) roles;
    }

    function getAccessControl_v1()
        internal
        pure
        returns (AccessControlLayout_v1 storage l_)
    {
        bytes32 position = POSITION_V1;

        assembly {
            l_.slot := position
        }
    }
}

/**
    Storage of previous version still available through getv1.
    In most cases we just start with a v1 contract but name the internals
    with their bare names.
 */
abstract contract sto_AccessControl_v2 {
    bytes32 internal constant POSITION_V2 =
        keccak256("teller_protocol.storage.asset_settings.v2");

    struct AccessControlLayout_v2 {
        bool notEntered;
        mapping(address => bool) whitelisted;
    }

    function getAccessControl_v2()
        internal
        pure
        returns (AccessControlLayout_v2 storage l_)
    {
        bytes32 position = POSITION_V2;

        assembly {
            l_.slot := position
        }
    }
}
