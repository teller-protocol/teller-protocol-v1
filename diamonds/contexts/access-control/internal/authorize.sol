// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./has-role.sol";

abstract contract int_authorize_AccessControl_v1 is
    int_hasRole_AccessControl_v1
{
    function authorize(bytes32 role, address account) internal view {
        require(_hasRole(role, account), "UNAUTHORIZED");
    }
}
