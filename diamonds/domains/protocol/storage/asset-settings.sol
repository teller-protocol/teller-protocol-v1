// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/PlatformSettingsLib.sol";
import "../libraries/CacheLib.sol";

abstract contract sto_AssetSettings_v1 {
    struct AssetSettingsLayout {
        mapping(address => CacheLib.Cache) assets;
    }

    bytes32 internal constant ASSET_SETTINGS_POSITION =
        keccak256("teller_protocol.storage.asset_settings.v1");

    function getAssetSettings()
        internal
        pure
        returns (AssetSettingsLayout storage l_)
    {
        bytes32 position = ASSET_SETTINGS_POSITION;

        assembly {
            l_.slot := position
        }
    }
}

abstract contract sto_AssetSettings is sto_AssetSettings_v1 {}
