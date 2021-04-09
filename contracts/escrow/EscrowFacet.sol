// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { AppStorageLib, AppStorage } from "../storage/app.sol";
import { LendingStorageLib, LendingStorage } from "../storage/lending.sol";
import { EscrowManager2 } from "./manager/EscrowManager2.sol";

contract EscrowFacet is EscrowManager2 {}
