// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_hasRole_AccessControl_v1 } from "../internal/has-role.sol";

abstract contract mod_authorized_AccessControl_v1 is int_hasRole_AccessControl_v1 {
    modifier authorized(bytes32 role, address account) {
        require(_hasRole(role, account), "UNAUTHORIZED");
        _;
    }
}