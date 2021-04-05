// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage.sol";

abstract contract int_pause_Pausable_v1 {
    function _pause(address context) internal {
        sto_Pausable.pausableStorage().paused[context] = true;
    }
}
