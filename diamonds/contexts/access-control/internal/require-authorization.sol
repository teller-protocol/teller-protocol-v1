// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./has-role.sol";

abstract contract int_requireAuthorization_AccessControl_v1 is
    int_hasRole_AccessControl_v1
{
    function _requireAuthorization(bytes32 role, address account)
        internal
        view
    {
        require(_hasRole(role, account), "AccessControl: unauthorized");
    }
}
