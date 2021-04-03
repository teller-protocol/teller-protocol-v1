// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libraries/PlatformSettingsLib.sol";
import "./libraries/CacheLib.sol";

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

abstract contract sto_AssetRegistry_v1 {
    struct Layout {
        mapping(string => address) addresses;
    }

    bytes32 internal constant POSITION =
        keccak256("teller_protocol.storage.asset_registry.v1");

    function getAssetRegistry() internal pure returns (Layout storage l_) {
        bytes32 position = POSITION;

        assembly {
            l_.slot := position
        }
    }
}

abstract contract sto_PlatformSettings_v1 {
    struct Layout {
        /**
            @notice It represents a mapping to identify the lending pools paused and not paused.

            i.e.: address(lending pool) => true or false.
        */
        mapping(address => bool) lendingPoolPaused;
        /**
            @notice Flag pausing the use of the Protocol
        */
        bool paused;
        /**
            @notice Flag restricting the use of the Protocol to authorizedAddress
         */
        bool platformRestricted;
    }

    bytes32 internal constant POSITION =
        keccak256("teller_protocol.storage.platform_settings.v1");

    function getPlatformSettings() internal pure returns (Layout storage l_) {
        bytes32 position = POSITION;

        assembly {
            l_.slot := position
        }
    }
}
