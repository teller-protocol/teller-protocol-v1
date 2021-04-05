// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/roles.sol";

abstract contract int_isAdminForRole_AccessControl_v1 {
    function _isAdminForRole(bytes32 role, address account)
        internal
        view
        returns (bool isAdminForRole_)
    {
        isAdminForRole_ = sto_AccessControl_Roles
            .accessControlRolesStore()
            .roles[
            sto_AccessControl_Roles.accessControlRolesStore().roles[role]
                .adminRole
        ]
            .members[account];
    }
}

abstract contract int_isAdminForRole_AccessControl is
    int_isAdminForRole_AccessControl_v1
{}
