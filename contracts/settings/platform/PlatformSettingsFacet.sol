// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN, AUTHORIZED } from "../../shared/roles.sol";

// Libraries
import {
    PlatformSettingsLib,
    PlatformSetting
} from "./libraries/PlatformSettingsLib.sol";
import { AppStorageLib } from "../../storage/app.sol";

// Storage
import { AppStorageLib, AppStorage } from "../../storage/app.sol";

/**
 * @notice Utility library of inline functions on the PlatformSetting struct.
 *
 * @author develop@teller.finance
 */
contract PlatformSettingsFacet is RolesMods {
    /**
     * @notice This event is emitted when a new platform setting is created.
     * @param settingName New setting name.
     * @param sender Address that created it.
     * @param value Value for the new setting.
     * @param minValue Minimum boundary for the new setting.
     * @param maxValue Maximum boundary for the new setting.
     */
    event PlatformSettingCreated(
        bytes32 indexed settingName,
        address indexed sender,
        uint256 value,
        uint256 minValue,
        uint256 maxValue
    );

    /**
     * @notice This event is emitted when a platform setting is updated.
     * @param settingName Keccak'ed settings name.
     * @param sender Address that updated it.
     * @param oldValue Previous value for the setting.
     * @param newValue New value for the setting.
     */
    event PlatformSettingUpdated(
        bytes32 indexed settingName,
        address indexed sender,
        uint256 oldValue,
        uint256 newValue
    );

    /**
     * @notice This event is emitted when a current platform setting is removed.
     * @param settingName setting name removed.
     * @param sender address that removed it.
     * @param oldMin Previous minimum boundary.
     * @param oldMax Previous minimum boundary.
     * @param newMin New minimum boundary.
     * @param newMax New maximum boundary.
     */
    event PlatformSettingBoundariesUpdated(
        bytes32 indexed settingName,
        address indexed sender,
        uint256 oldMin,
        uint256 oldMax,
        uint256 newMin,
        uint256 newMax
    );

    /**
     * @notice Gets the values for a platform setting name.
     * @param name The keccak'ed name for a setting.
     * @return setting_ Values for the setting {name}
     */
    function getPlatformSetting(bytes32 name)
        external
        view
        returns (PlatformSetting memory setting_)
    {
        setting_ = PlatformSettingsLib.s(name);
    }

    /**
     * @notice It creates a new platform setting given a name, min and max values.
     * @param name Keccak'ed name for the setting.
     * @param value Initial value for the setting.
     * @param min Minimum value allowed for the setting.
     * @param max Maximum value allowed for the setting.
     */
    function createPlatformSetting(
        bytes32 name,
        uint256 value,
        uint256 min,
        uint256 max
    ) external authorized(ADMIN, msg.sender) {
        require(
            !PlatformSettingsLib.s(name).exists,
            "Teller: platform setting already exists"
        );
        require(value >= min, "Teller: platform setting value less than min");
        require(
            value <= max,
            "Teller: platform setting value greater than max"
        );

        PlatformSettingsLib.s(name).value = value;
        PlatformSettingsLib.s(name).min = min;
        PlatformSettingsLib.s(name).max = max;
        PlatformSettingsLib.s(name).exists = true;

        emit PlatformSettingCreated(name, msg.sender, value, min, max);
    }

    /**
     * @notice It updates a current platform setting.
     * @param name Keccak'ed name for the setting.
     * @param newValue the new value to set in the platform setting.
     *
     * Requirements:
     *  - New value is equal to the current value.
     *  - New value is grater than the max value.
     *  - New value is less than the min value
     */
    function updatePlatformSetting(bytes32 name, uint256 newValue)
        external
        authorized(ADMIN, msg.sender)
        returns (uint256 oldValue)
    {
        require(
            PlatformSettingsLib.s(name).exists,
            "Teller: platform setting not exists"
        );
        require(
            PlatformSettingsLib.s(name).value != newValue,
            "Teller: new platform setting not different"
        );
        require(
            newValue >= PlatformSettingsLib.s(name).min,
            "Teller: new platform setting less than min"
        );
        require(
            newValue <= PlatformSettingsLib.s(name).max,
            "Teller: new platform setting greater than max"
        );

        oldValue = PlatformSettingsLib.s(name).value;
        PlatformSettingsLib.s(name).value = newValue;

        emit PlatformSettingUpdated(name, msg.sender, oldValue, newValue);
    }

    /**
     * @notice Updates the boundary (min & max) values for a platform setting.
     * @param name Keccak'ed name for the setting.
     * @param min New minimum boundary for the setting.
     * @param max New maximum boundary for the setting.
     */
    function updatePlatformSettingBoundaries(
        bytes32 name,
        uint256 min,
        uint256 max
    ) external authorized(ADMIN, msg.sender) {
        require(
            PlatformSettingsLib.s(name).exists,
            "Teller: platform setting not exists"
        );

        emit PlatformSettingBoundariesUpdated(
            name,
            msg.sender,
            PlatformSettingsLib.s(name).min,
            PlatformSettingsLib.s(name).max,
            min,
            max
        );

        PlatformSettingsLib.s(name).min = min;
        PlatformSettingsLib.s(name).max = max;
    }
}
