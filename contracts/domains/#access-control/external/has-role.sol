// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { s_AccessControl } from "../../../storage/AccessControl.sol";
import { int_GetStorageV1 } from "../internal/get-storage.sol";

abstract contract ext_HasRoleV1 {
    function hasRole(
        uint8 role,
        address account,
        uint8 domain
    ) external view returns (bool hasRole_) {
        s_AccessControl.Layout storage layout = s_AccessControl.get();
        return layout.userRoleDomain[account][role][domain];
    }
}

/**
    has access to storage internal.
 */
abstract contract ext_HasRoleV2 is int_GetStorageV1 {
    function hasRole(
        uint8 role,
        address account,
        uint8 domain
    ) external view returns (bool hasRole_) {
        return
            getStorage().userRoleDomain[account][role][domain] ||
            getStorage().userRoleDomain[account][role][0];
    }
}
