// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    int_isAdminForRole_AccessControl_v1
} from "../internal/is-admin-for-role.sol";
import { int_revokeRole_AccessControl_v1 } from "../internal/revoke-role.sol";

abstract contract ext_revokeRole_AccessControl_v1 is
    int_isAdminForRole_AccessControl_v1,
    int_revokeRole_AccessControl_v1
{
    function revokeRole(bytes32 role, address account) external {
        require(_isAdminForRole(role, msg.sender), "NOT_ADMIN");
        _revokeRole(role, account);
    }
}
