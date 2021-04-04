// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./internal/grant-role.sol";
import "./internal/revoke-role.sol";
import "./internal/setup-role.sol";
import "./internal/renounce-role.sol";

contract ctx_AccessControl_v1 is
    int_grantRole_AccessControl_v1,
    int_revokeRole_AccessControl_v1,
    int_renounceRole_AccessControl_v1,
    int_setupRole_AccessControl_v1
{}
