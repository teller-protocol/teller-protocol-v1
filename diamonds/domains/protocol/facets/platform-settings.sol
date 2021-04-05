// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../contexts/access-control/storage.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";
import "../storage/platform-settings.sol";
import "../storage/asset-settings.sol";
import "../storage/asset-registry.sol";
import "../internal/asset-setting-names.sol";
import "../internal/setting-names.sol";
import "../internal/platform-settings.sol";
import { ADMIN, PAUSER } from "../internal/roles.sol";

// Interfaces
import "diamonds/providers/compound/CErc20Interface.sol";
import "../interfaces/IPlatformSettings.sol";

// Libraries
import "../../../libraries/AddressArrayLib.sol";
import "../../../libraries/CacheLib.sol";
import "../../../libraries/PlatformSettingsLib.sol";

abstract contract ent_PlatformSettings_v1 is
    sto_AccessControl,
    mod_authorized_AccessControl_v1,
    sto_PlatformSettings,
    IPlatformSettings,
    IAssetSettings,
    sto_AssetRegistry
{
    using AddressArrayLib for AddressArrayLib.AddressArray;
    using AddressLib for address;
    using CacheLib for CacheLib.Cache;
    using PlatformSettingsLib for PlatformSettingsLib.PlatformSetting;

    /**
        @notice It creates a new platform setting given a setting name, value, min and max values.
        @param settingName setting name to create.
        @param value the initial value for the given setting name.
        @param minValue the min value for the setting.
        @param maxValue the max value for the setting.
     */
    function createPlatformSetting(
        bytes32 settingName,
        uint256 value,
        uint256 minValue,
        uint256 maxValue
    ) external override authorized(ADMIN, msg.sender) {
        require(settingName != "", "SETTING_NAME_MUST_BE_PROVIDED");
        s().platformSettings[settingName].initialize(value, minValue, maxValue);

        emit PlatformSettingCreated(
            settingName,
            msg.sender,
            value,
            minValue,
            maxValue
        );
    }

    /**
        @notice It updates an existent platform setting given a setting name.
        @notice It only allows to update the value (not the min or max values).
        @notice In case you need to update the min or max values, you need to remove it, and create it again.
        @param settingName setting name to update.
        @param newValue the new value to set.
     */
    function updatePlatformSetting(bytes32 settingName, uint256 newValue)
        external
        override
        authorized(ADMIN, msg.sender)
    {
        uint256 oldValue = s().platformSettings[settingName].update(newValue);

        emit PlatformSettingUpdated(
            settingName,
            msg.sender,
            oldValue,
            newValue
        );
    }

    /**
        @notice Removes a current platform setting given a setting name.
        @param settingName to remove.
     */
    function removePlatformSetting(bytes32 settingName)
        external
        override
        authorized(ADMIN, msg.sender)
    {
        uint256 oldValue = s().platformSettings[settingName].value;
        s().platformSettings[settingName].remove();

        emit PlatformSettingRemoved(settingName, oldValue, msg.sender);
    }

    function pause() external override authorized(PAUSER, msg.sender) {
        _pause(address(this));
    }

    function unpause() external ovreride authorized(PAUSER, msg.sender) {
        _unpause(address(this));
    }

    /**
        @notice It pauses a specific lending pool.
        @param marketAddress lending pool address to pause.
     */
    function pauseMarket(address marketAddress)
        external
        override
        authorized(PAUSER, msg.sender)
        whenNotPaused(address(this))
    {
        _pause(marketAddress);
    }

    /**
        @notice It unpauses a specific lending pool.
        @param marketAddress market address to unpause.
     */
    function unpauseMarket(address marketAddress)
        external
        override
        authorized(PAUSER, msg.sender)
        whenNotPaused(address(this))
    {
        _unpause(marketAddress);
    }

    function s()
        private
        pure
        returns (sto_PlatformSettings.PlatformSettingsLayout storage l_)
    {
        l_ = getPlatformSettings();
    }
}
