// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import {
    CacheLib,
    Cache,
    CacheType
} from "../../shared/libraries/CacheLib.sol";
import {
    PrizePoolInterface
} from "../../dapps/interfaces/PrizePoolInterface.sol";

// Storage
import { AppStorageLib } from "../../storage/app.sol";

/**
 * @notice Utility library of inline functions for MaxTVLAmount asset setting.
 *
 * @author develop@teller.finance
 */
library AssetPPoolLib {
    bytes32 private constant NAME = keccak256("pPoolAddress");

    function s(address asset) private view returns (Cache storage) {
        return AppStorageLib.store().assetSettings[asset];
    }

    function get(address asset) internal view returns (PrizePoolInterface) {
        return PrizePoolInterface(s(asset).addresses[NAME]);
    }

    function set(address asset, address newValue) internal {
        s(asset).addresses[NAME] = newValue;
    }
}
