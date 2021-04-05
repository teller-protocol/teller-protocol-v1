// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../data.sol";
import "./has-role.sol";

abstract contract int_revokeRole_AccessControl_v1 is
    dat_AccessControl_v1,
    int_hasRole_AccessControl_v1
{
    function _revokeRole(bytes32 role, address account) internal {
        if (!_hasRole(role, account)) return;
        accessControlRolesStore().roles[role].members[account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }
}

abstract contract int_revokeRole_AccessControl is
    int_revokeRole_AccessControl_v1
{}
