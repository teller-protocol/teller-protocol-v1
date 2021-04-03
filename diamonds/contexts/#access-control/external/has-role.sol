// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { sto_AccessControl_v1 } from "../storage.sol";
import { int_get_sto_AccessControl_v1 } from "../internal/get-storage.sol";
import { int_hasRole_AccessControl_v1 } from "../internal/has-role.sol";

abstract contract ext_hasRole_AccessControl_V1 is int_hasRole_AccessControl_v1 {
    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool hasRole_) {
        hasRole_ = _hasRole(role, account);
    }
}

abstract contract ext_hasRole_AccessControl is ext_hasRole_AccessControl_V1 {}