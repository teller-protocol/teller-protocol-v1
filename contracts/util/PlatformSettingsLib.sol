pragma solidity 0.5.17;

/**
    @notice Utility library of inline functions on the PlatformSetting struct.

    @author develop@teller.finance
 */
library PlatformSettingsLib {
    /**
        It defines a platform settings. It includes: value, min, and max values.
     */
    struct PlatformSetting {
        uint256 value;
        uint256 min;
        uint256 max;
        bool exists;
        bool removable;
        SettingTimelock timelock;
    }

    struct SettingTimelock {
        uint256 lockedUntil;
        uint256 newValue;
        bool remove;
    }

    /**
        @notice It creates a new platform setting given a name, min and max values.
        @param value initial value for the setting.
        @param min min value allowed for the setting.
        @param max max value allowed for the setting.
     */
    function initialize(
        PlatformSetting storage self,
        uint256 value,
        uint256 min,
        uint256 max
    ) internal {
        require(!self.exists, "PLATFORM_SETTING_ALREADY_EXISTS");
        require(value >= min, "VALUE_MUST_BE_GTE_MIN_VALUE");
        require(value <= max, "VALUE_MUST_BE_LTE_MAX_VALUE");
        self.value = value;
        self.min = min;
        self.max = max;
        self.exists = true;
    }

    /**
        @notice This requires that a platform setting has a timelock pending and can be applied.
        @param self the current platform setting.
     */
    function requireTimelock(PlatformSetting memory self) internal {
        require(self.exists, "PLATFORM_SETTING_NOT_EXISTS");
        require(self.timelock.lockedUntil != 0, "SETTING_NOT_TIMELOCKED");
        require(self.timelock.lockedUntil <= now, "MIN_TIMELOCK_NOT_ELAPSED");
    }

    /**
        @notice Creates a new timelock for a setting change.
        @dev It only allows to update the value (not the min or max values).
        @dev In case you need to update the min or max values, you need to remove it, and create it again.
        @param self the current platform setting.
        @param newValue new value of the setting.
        @param timelockDuration amount of time, in seconds, required to pass until value can be update.
     */
    function updateWithTimelock(PlatformSetting storage self, uint256 newValue, uint256 timelockDuration) internal {
        require(self.exists, "PLATFORM_SETTING_NOT_EXISTS");
        require(self.timelock.lockedUntil == 0, "TIMELOCK_ALREADY_EXISTS");
        require(self.value != newValue, "NEW_VALUE_REQUIRED");
        require(newValue >= self.min, "NEW_VALUE_MUST_BE_GTE_MIN_VALUE");
        require(newValue <= self.max, "NEW_VALUE_MUST_BE_LTE_MAX_VALUE");

        self.timelock.newValue = newValue;
        self.timelock.lockedUntil = now + timelockDuration;
    }

    function removeWithTimelock(PlatformSetting storage self, uint256 timelockDuration) internal {
        require(self.exists, "PLATFORM_SETTING_NOT_EXISTS");
        require(self.timelock.lockedUntil == 0, "TIMELOCK_ALREADY_EXISTS");

        self.timelock.remove = true;
        self.timelock.lockedUntil = now + timelockDuration;
    }
}
