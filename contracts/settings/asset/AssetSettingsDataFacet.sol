// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN, AUTHORIZED } from "../../shared/roles.sol";

// Interfaces
import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";

// Libraries
import {
    CacheLib,
    Cache,
    CacheType
} from "../../shared/libraries/CacheLib.sol";
import { AssetCTokenLib } from "./AssetCTokenLib.sol";
import { MaxTVLAmountLib } from "./MaxTVLAmountLib.sol";

// Storage
import { AppStorageLib, AppStorage } from "../../storage/app.sol";

/**
 * @notice Utility library of inline functions on the PlatformSetting struct.
 *
 * @author develop@teller.finance
 */
contract AssetSettingsDataFacet {
    function getAssetCToken(address asset)
        external
        view
        returns (ICErc20 cToken_)
    {
        cToken_ = AssetCTokenLib.get(asset);
    }

    function getAssetMaxTVLAmount(address asset)
        external
        view
        returns (uint256 maxTVL_)
    {
        maxTVL_ = MaxTVLAmountLib.get(asset);
    }
}
