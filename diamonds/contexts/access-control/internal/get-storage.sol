// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { sto_AccessControl } from "../storage.sol";

abstract contract int_get_sto_AccessControl_v1 is sto_AccessControl {
    function getStorage()
        internal
        pure
        returns (AccessControlLayout storage l_)
    {
        l_ = accessControl();
    }
}
