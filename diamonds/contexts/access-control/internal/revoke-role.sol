// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../data.sol";
import "./is-admin-for-role.sol";

abstract contract int_revokeRole_AccessControl_v1 is
    int_isAdminForRole_AccessControl_v1,
    dat_AccessControl_v1
{
    function _revokeRole(bytes32 role, address account) internal {
        require(_isAdminForRole(role, msg.sender), "AccessControl: not admin");
        accessControlRolesStore().roles[role].members[account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }
}

abstract contract int_revokeRole_AccessControl is
    int_revokeRole_AccessControl_v1
{}
