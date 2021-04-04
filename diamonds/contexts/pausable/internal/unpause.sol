// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage.sol";

abstract contract int_unpause_Pausable_v1 is sto_Pausable_v1 {
    function _unpause(address context) internal {
        pausableStorage().paused[context] = false;
    }
}
