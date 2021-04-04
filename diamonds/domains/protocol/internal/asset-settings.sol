// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { AssetSettingNames } from "diamonds/Constants.sol";
import "diamonds/Roles.sol";
import "diamonds/providers/compound/CErc20Interface.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";
import "../storage/asset-settings.sol";
import "../storage/asset-registry.sol";
import "../../../libraries/CacheLib.sol";
import "../interfaces/IAssetSettings.sol";

abstract contract AssetSettingsManagement is
    AssetSettingNames,
    sto_AccessControl_Roles,
    sto_AssetSettings,
    sto_AssetRegistry
{}
