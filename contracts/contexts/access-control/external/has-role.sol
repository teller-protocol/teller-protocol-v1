// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_hasRole_AccessControl_v1 } from "../internal/has-role.sol";

contract ext_hasRole_AccessControl_V1 is int_hasRole_AccessControl_v1 {
    function hasRole(bytes32 role, address account)
        external
        view
        returns (bool hasRole_)
    {
        hasRole_ = _hasRole(role, account);
    }
}

contract ext_hasRole_AccessControl is ext_hasRole_AccessControl_V1 {}
