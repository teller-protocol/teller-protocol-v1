// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { AppStorageLib, AppStorage } from "../storage/app.sol";
import { LendingStorageLib, LendingStorage } from "../storage/lending.sol";
import { Controller2 } from "./manager/Controller2.sol";

contract EscrowFacet is Controller2 {}
