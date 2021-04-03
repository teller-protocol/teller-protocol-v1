// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./asset-setting-names.sol";
import "./roles.sol";
import "../../../contexts/#access-control/modifiers/authorized.sol";
import "../../../contexts/#access-control/storage.sol";
import "../storage/asset-settings.sol";
import "../storage/asset-registry.sol";
import "../../../../contracts/providers/compound/CErc20Interface.sol";
import "../libraries/CacheLib.sol";
import "../interfaces/AssetSettingsInterface.sol";

abstract contract AssetSettingsManagement is
    Roles,
    AssetSettingNames,
    sto_AccessControl_v1,
    sto_AssetSettings_v1,
    sto_AssetRegistry_v1
{}
