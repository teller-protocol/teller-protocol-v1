// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../data.sol";
import "./get-storage.sol";
import "./has-role.sol";

abstract contract int_grantRole_AccessControl_v1 is
    int_get_sto_AccessControl_v1,
    int_hasRole_AccessControl_v1,
    dat_AccessControl_v1
{
    function _grantRole(bytes32 role, address account) internal {
        if (_hasRole(role, account)) return;
        getStorage().roles[role].members[account] = true;
        emit RoleGranted(role, account, msg.sender);
    }
}

abstract contract int_grantRole_AccessControl is
    int_grantRole_AccessControl_v1
{}
