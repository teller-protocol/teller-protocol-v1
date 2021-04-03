// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract sto_PlatformSettings_v1 {
    struct Layout {
        mapping(address => bool) lendingPoolPaused;
        bool paused;
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
