// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_AccessControl_v1 } from "./get-storage.sol";

abstract contract int_isAdminForRole_AccessControl_v1 is
    int_get_sto_AccessControl_v1
{
    function _isAdminForRole(bytes32 role, address account)
        internal
        view
        returns (bool isAdminForRole_)
    {
        isAdminForRole_ = getStorage().roles[getStorage().roles[role].adminRole]
            .members[account];
    }
}

abstract contract int_isAdminForRole_AccessControl is
    int_isAdminForRole_AccessControl_v1
{}
