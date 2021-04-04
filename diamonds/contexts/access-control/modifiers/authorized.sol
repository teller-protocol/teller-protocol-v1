// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_authorize_AccessControl_v1 } from "../internal/authorize.sol";

abstract contract mod_authorized_AccessControl_v1 is
    int_authorize_AccessControl_v1
{
    modifier authorized(bytes32 role, address account) {
        authorize(role, account);
        _;
    }
}
