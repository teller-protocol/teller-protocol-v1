// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../contexts/access-control/storage/roles.sol";
import "../storage/asset-settings.sol";
import "../storage/asset-registry.sol";

abstract contract AssetSettingsManagement is
    sto_AccessControl_Roles,
    sto_AssetSettings,
    sto_AssetRegistry
{}
