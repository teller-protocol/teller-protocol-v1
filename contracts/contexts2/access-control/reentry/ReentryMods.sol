// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AccessControlStorageLib, AccessControlStorage } from "../storage.sol";

abstract contract ReentryMods {
    /**
     * @notice Reentry modifier
     *
     * @dev It makes sure that a function isn't re-entered more than once through
     * @dev a fallback function. This works by marking a mapping to a bytes32 as true
     * @dev the moment a function commences. Afterwards, when the function ends, it
     * @dev maps to a false value.
     */

    /***
        Run by the idea of using nonReentry once to execute throughout the whole
        diamond through Nick Mudgen. 
      */
    modifier nonReentry(bytes32 id) {
        AccessControlStorage storage s = AccessControlStorageLib.store();
        require(!s.entered[id], "AccessControl: reentered");
        s.entered[id] = true;
        _;
        s.entered[id] = false;
    }
}
