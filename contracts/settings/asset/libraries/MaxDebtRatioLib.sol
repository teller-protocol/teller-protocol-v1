// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import {
    CacheLib,
    Cache,
    CacheType
} from "../../../shared/libraries/CacheLib.sol";

// Storage
import { AppStorageLib } from "../../../storage/app.sol";

/**
 * @notice Utility library of inline functions for MaxDebtRatio asset setting.
 *
 * @author develop@teller.finance
 */
library MaxDebtRatioLib {
    bytes32 private constant NAME = keccak256("MaxDebtRatio");

    function s(address asset) private view returns (Cache storage) {
        return AppStorageLib.store().assetSettings[asset];
    }

    function get(address asset) internal view returns (uint16) {
        return uint16(s(asset).uints[NAME]);
    }

    function set(address asset, uint16 newValue) internal {
        s(asset).uints[NAME] = uint256(newValue);
    }
}
