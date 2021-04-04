// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./get-storage.sol";
import "../data.sol";
import "./has-role.sol";

abstract contract int_renounceRole_AccessControl_v1 is
    int_get_sto_AccessControl_v1,
    int_hasRole_AccessControl_v1,
    dat_AccessControl_v1
{
    function _renounceRole(bytes32 role, address account) internal {
        require(_hasRole(role, msg.sender), "CAN'T RENOUNCE");
        getStorage().roles[role].members[account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }
}

abstract contract int_renounceRole_AccessControl is
    int_renounceRole_AccessControl_v1
{}
