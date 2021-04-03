// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { sto_AccessControl_v2 } from "../storage.sol";

abstract contract mod_entry_Domain_v1 is sto_AccessControl_v2 {
    modifier entry {
        sto_AccessControl_v2.Layout_v2 storage layout = sto_AccessControl_v2.getv2();
        require(layout.notEntered, "RE_ENTRANCY");
        layout.notEntered = false;
        _;
        layout.notEntered = true;
    }
}