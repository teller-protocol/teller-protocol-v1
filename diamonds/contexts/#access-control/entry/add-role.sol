// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { sto_AccessControl_v1 } from "../storage.sol";
import { int_get_sto_AccessControl_V1 } from "../internal/get-storage.sol";
import { int_hasRole_AccessControl_v2 } from "../internal/has-role.sol";
import { int_isAdminForRole_AccessControl_v1 } from "../internal/is-admin-for-role.sol";
import { ext_hasRole_AccessControl_V2 } from "../external/has-role.sol";

abstract contract ent_addRole_AccessControl_V1 is int_isAdminForRole_AccessControl_v1 {
    function addRole(   
        Roles role,
        address account,
        Domains domain
    ) external view returns (bool hasRole_) {
        require(_isAdminForRole(role, account), "NOT_ADMIN");
        
        sto_AccessControl.Layout storage layout = s_AccessControl.get();
        return layout.userRoleDomain[account][role][domain];
    }
}

function addRole(
    Roles role,
    address account,
    Domains domain
) external view returns (bool hasRole_) {
    require(has)
    sto_AccessControl.Layout storage layout = s_AccessControl.get();
    return layout.userRoleDomain[account][role][domain];
}
