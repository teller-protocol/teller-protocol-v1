// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libraries/PlatformSettingsLib.sol";
import "../../../libraries/CacheLib.sol";

abstract contract sto_AssetSettings {
    struct AssetSettingsLayout {
        mapping(address => CacheLib.Cache) assets;
    }

    function getAssetSettings()
        internal
        pure
        returns (AssetSettingsLayout storage l_)
    {
        bytes32 position = keccak256("teller_protocol.storage.asset_settings");

        assembly {
            l_.slot := position
        }
    }
}
