// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AccessControlStorageLib, AccessControlStorage } from "../storage.sol";

abstract contract ReentryMods {
    modifier nonReentry(bytes32 id) {
        AccessControlStorage storage s = AccessControlStorageLib.store();
        require(!s.entered[id], "AccessControl: reentered");
        s.entered[id] = true;
        _;
        s.entered[id] = false;
    }
}
