// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./internal/pause.sol";
import "./internal/unpause.sol";

contract ctx_Pausable_v1 is int_pause_Pausable_v1, int_unpause_Pausable_v1 {}
