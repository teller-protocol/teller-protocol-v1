// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    int_requireAuthorization_AccessControl_v1
} from "../internal/require-authorization.sol";

abstract contract mod_authorized_AccessControl_v1 is
    int_requireAuthorization_AccessControl_v1
{
    modifier authorized(bytes32 role, address account) {
        _requireAuthorization(role, account);
        _;
    }
}

abstract contract mod_authorized_AccessControl is
    mod_authorized_AccessControl_v1
{}
