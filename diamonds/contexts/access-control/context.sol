// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./internal/grant-role.sol";
import "./internal/revoke-role.sol";
import "./internal/renounce-role.sol";

abstract contract ctx_AccessControl_v1 is
    int_grantRole_AccessControl_v1,
    int_revokeRole_AccessControl_v1,
    int_renounceRole_AccessControl_v1
{}
