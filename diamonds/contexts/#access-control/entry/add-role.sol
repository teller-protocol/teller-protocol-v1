// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { sto_AccessControl_v1 } from "../storage.sol";
import { int_get_sto_AccessControl_v1 } from "../internal/get-storage.sol";
import { int_hasRole_AccessControl_v1 } from "../internal/has-role.sol";
import {
    int_isAdminForRole_AccessControl_v1
} from "../internal/is-admin-for-role.sol";
import { ext_hasRole_AccessControl_V1 } from "../external/has-role.sol";

abstract contract ent_addRole_AccessControl_V1 is
    int_isAdminForRole_AccessControl_v1
{
    function addRole(bytes32 role, address account)
        external
        returns (bool hasRole_)
    {
        require(_isAdminForRole(role, account), "NOT_ADMIN");

        sto_AccessControl.Layout storage layout = sto_AccessControl_v1.get();
        return layout.userRoleDomain[account][role];
    }
}
