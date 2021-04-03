// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { s_AccessControl } from "../../../../storage/AccessControl.sol";

abstract contract HasRoleV1 {
    function hasRole(
        uint8 role,
        address account,
        uint8 domain
    ) external view returns (bool hasRole_) {
        s_AccessControl.Layout storage layout = s_AccessControl.get();
        return layout.userRoleDomain[account][role][domain];
    }
}
