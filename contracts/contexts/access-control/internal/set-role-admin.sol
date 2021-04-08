// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AccessControlEvents } from "../data.sol";
import "./admin-role-for.sol";

abstract contract int_setRoleAdmin_AccessControl_v1 is
    int_adminRoleFor_AccessControl_v1
{
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal {
        accessControlRolesStore().roles[role].adminRole = adminRole;
        emit AccessControlEvents.RoleAdminChanged(
            role,
            _adminRoleFor(role),
            adminRole
        );
    }
}
