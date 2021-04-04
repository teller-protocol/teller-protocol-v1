// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_AccessControl_v1 } from "./get-storage.sol";

abstract contract int_hasRole_AccessControl_v1 is int_get_sto_AccessControl_v1 {
    function _hasRole(bytes32 role, address account)
        internal
        view
        returns (bool hasRole_)
    {
        hasRole_ = getStorage().roles[role].members[account];
    }
}
