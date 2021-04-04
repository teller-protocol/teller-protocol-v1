// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { sto_AccessControl_v1 } from "../storage.sol";

abstract contract int_get_sto_AccessControl_v1 is sto_AccessControl_v1 {
    function getStorage()
        internal
        pure
        returns (sto_AccessControl_v1.AccessControlLayout_v1 storage l_)
    {
        l_ = getAccessControl_v1();
    }
}

abstract contract int_get_sto_AccessControl is int_get_sto_AccessControl_v1 {}
