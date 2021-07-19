// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import {
    CacheLib,
    Cache,
    CacheType
} from "../../../shared/libraries/CacheLib.sol";
import { ICErc20 } from "../../../shared/interfaces/ICErc20.sol";

// Storage
import { AppStorageLib } from "../../../storage/app.sol";

/**
 * @notice Utility library of inline functions for Compound asset setting.
 *
 * @author develop@teller.finance
 */
library AssetCTokenLib {
    bytes32 private constant NAME = keccak256("cToken");

    function s(address asset) private view returns (Cache storage) {
        return AppStorageLib.store().assetSettings[asset];
    }

    function get(address asset) internal view returns (ICErc20) {
        return ICErc20(s(asset).addresses[NAME]);
    }

    function set(address asset, address newValue) internal {
        s(asset).addresses[NAME] = newValue;
    }
}
