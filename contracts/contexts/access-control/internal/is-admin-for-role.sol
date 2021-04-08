// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/roles.sol";

abstract contract int_isAdminForRole_AccessControl_v1 is
    sto_AccessControl_Roles
{
    function _isAdminForRole(bytes32 role, address account)
        internal
        view
        returns (bool isAdminForRole_)
    {
        isAdminForRole_ = accessControlRolesStore().roles[
            accessControlRolesStore().roles[role].adminRole
        ]
            .members[account];
    }
}
