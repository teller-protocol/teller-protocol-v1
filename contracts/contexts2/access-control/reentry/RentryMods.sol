// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AccessControlStorageLib } from "../storage.sol";

abstract contract ReentryMods {
    modifier nonReentry(bytes32 id) {
        bool storage entered = AccessControlStorageLib.store().entered[id];
        require(!entered, "AccessControl: reentered");
        entered = true;
        _;
        entered = false;
    }
}
