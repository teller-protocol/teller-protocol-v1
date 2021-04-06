// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    int_adminRoleFor_AccessControl_v1
} from "../internal/admin-role-for.sol";

contract ext_adminRoleFor_AccessControl_V1 is
    int_adminRoleFor_AccessControl_v1
{
    function adminRoleFor(bytes32 role)
        external
        view
        returns (bytes32 adminRoleFor_)
    {
        adminRoleFor_ = _adminRoleFor(role);
    }
}

contract ext_adminRoleFor_AccessControl is int_adminRoleFor_AccessControl_v1 {}
