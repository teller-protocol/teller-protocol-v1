// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { MarketStorageLib, LoanStatus } from "../storage/market.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { LoansMods } from "../market/LoansMods.sol";
import { PausableMods } from "../contexts2/pausable/PausableMods.sol";
import { AUTHORIZED } from "../shared/roles.sol";
import { LibDapps } from "./libraries/LibDapps.sol";

contract YearnFacet is RolesMods, PausableMods, LoansMods {}
