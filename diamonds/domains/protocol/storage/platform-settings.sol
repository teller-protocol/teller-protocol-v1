// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libraries/PlatformSettingsLib.sol";

abstract contract sto_PlatformSettings_v1 {
    using PlatformSettingsLib for PlatformSettingsLib.PlatformSetting;
    struct PlatformSettingsLayout {
        bool platformRestricted;
        mapping(bytes32 => PlatformSettingsLib.PlatformSetting) platformSettings;
    }

    bytes32 internal constant POSITION =
        keccak256("teller_protocol.storage.platform_settings.v1");

    function getPlatformSettings()
        internal
        pure
        returns (PlatformSettingsLayout storage l_)
    {
        bytes32 position = POSITION;

        assembly {
            l_.slot := position
        }
    }
}
