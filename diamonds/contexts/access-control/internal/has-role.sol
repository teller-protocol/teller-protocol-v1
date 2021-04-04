// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/roles.sol";

abstract contract int_hasRole_AccessControl_v1 is sto_AccessControl_Roles {
    function _hasRole(bytes32 role, address account)
        internal
        view
        returns (bool hasRole_)
    {
        hasRole_ = accessControlRolesStore().roles[role].members[account];
    }
}
