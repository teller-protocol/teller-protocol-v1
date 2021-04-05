// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../storage.sol";

abstract contract mod_whenNotPaused_Pausable_v1 is sto_Pausable {
    modifier whenNotPaused(address context) {
        require(!pausableStorage().paused[context], "PAUSED");
        _;
    }
}
