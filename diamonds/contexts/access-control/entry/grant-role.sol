// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    int_isAdminForRole_AccessControl_v1
} from "../internal/is-admin-for-role.sol";
import { int_grantRole_AccessControl_v1 } from "../internal/grant-role.sol";

abstract contract ext_grantRole_AccessControl_v1 is
    int_isAdminForRole_AccessControl_v1,
    int_grantRole_AccessControl_v1
{
    function grantRole(bytes32 role, address account) external {
        require(_isAdminForRole(role, msg.sender), "NOT_ADMIN");
        _grantRole(role, account);
    }
}

abstract contract ext_grantRole_AccessControl is
    ext_grantRole_AccessControl_v1
{}
