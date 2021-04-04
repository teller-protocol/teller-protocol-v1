// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../access-control/internal/grant-role.sol";
import "../access-control/internal/revoke-role.sol";
import "../access-control/internal/renounce-role.sol";

contract ctx_Initializable_v1 is
    int_grantRole_AccessControl_v1,
    int_revokeRole_AccessControl_v1,
    int_renounceRole_AccessControl_v1
{}
