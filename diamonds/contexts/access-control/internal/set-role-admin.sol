// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../data.sol";
import "./admin-role-for.sol";

abstract contract int_setRoleAdmin_AccessControl_v1 is
    dat_AccessControl_v1,
    int_adminRoleFor_AccessControl_v1
{
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal {
        emit RoleAdminChanged(role, _adminRoleFor(role), adminRole);
        sto_AccessControl_Roles.accessControlRolesStore().roles[role]
            .adminRole = adminRole;
    }
}

abstract contract int_setRoleAdmin_AccessControl is
    int_setRoleAdmin_AccessControl_v1
{}
