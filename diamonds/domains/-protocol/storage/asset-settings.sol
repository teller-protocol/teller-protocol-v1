// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/PlatformSettingsLib.sol";
import "../libraries/CacheLib.sol";

abstract contract sto_AssetSettings_v1 {
    struct Layout {
        mapping(address => CacheLib.Cache) assets;
    }

    bytes32 internal constant POSITION =
        keccak256("teller_protocol.storage.asset_settings.v1");

    function getAssetSettings() internal pure returns (Layout storage l_) {
        bytes32 position = POSITION;

        assembly {
            l_.slot := position
        }
    }
}

abstract contract sto_AssetSettings is sto_AssetSettings_v1 {}
