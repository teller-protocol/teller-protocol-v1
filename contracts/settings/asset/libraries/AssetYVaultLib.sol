// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import {
    CacheLib,
    Cache,
    CacheType
} from "../../../shared/libraries/CacheLib.sol";
import { IVault } from "../../../escrow/dapps/interfaces/IVault.sol";

// Storage
import { AppStorageLib } from "../../../storage/app.sol";

/**
 * @notice Utility library of inline functions for Yearn vault asset setting.
 *
 * @author develop@teller.finance
 */
library AssetYVaultLib {
    bytes32 private constant NAME = keccak256("yVault");

    function s(address asset) private view returns (Cache storage) {
        return AppStorageLib.store().assetSettings[asset];
    }

    function get(address asset) internal view returns (IVault) {
        return IVault(s(asset).addresses[NAME]);
    }

    function set(address asset, address newValue) internal {
        s(asset).addresses[NAME] = newValue;
    }
}
