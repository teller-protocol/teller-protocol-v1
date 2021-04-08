// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { AccessControlEvents } from "../data.sol";
import "./has-role.sol";

abstract contract int_revokeRole_AccessControl_v1 is
    int_hasRole_AccessControl_v1
{
    function _revokeRole(bytes32 role, address account) internal {
        if (!_hasRole(role, account)) return;
        accessControlRolesStore().roles[role].members[account] = false;
        emit AccessControlEvents.RoleRevoked(role, account, msg.sender);
    }
}
