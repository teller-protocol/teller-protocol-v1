// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./grant-role.sol";

abstract contract int_setupRole_AccessControl_v1 is
    int_grantRole_AccessControl_v1
{
    function _setupRole(bytes32 role, address account) internal {
        _grantRole(role, account);
    }
}
