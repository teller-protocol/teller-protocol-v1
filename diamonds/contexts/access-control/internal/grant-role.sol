// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../data.sol";
import "./has-role.sol";
import "./is-admin-for-role.sol";

abstract contract int_grantRole_AccessControl_v1 is
    dat_AccessControl_v1,
    int_hasRole_AccessControl_v1,
    int_isAdminForRole_AccessControl_v1
{
    function _grantRole(bytes32 role, address account) internal {
        require(_isAdminForRole(role, msg.sender), "NOT_ADMIN");
        if (_hasRole(role, account)) return;
        sto_AccessControl_Roles.accessControlRolesStore().roles[role].members[
            account
        ] = true;
        emit RoleGranted(role, account, msg.sender);
    }
}

abstract contract int_grantRole_AccessControl is
    int_grantRole_AccessControl_v1
{}
