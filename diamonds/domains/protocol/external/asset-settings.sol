// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../internal/asset-setting-names.sol";
import "../storage/asset-settings.sol";
import "../../../libraries/CacheLib.sol";

abstract contract ext_AssetSettings_v1 is
    AssetSettingNames,
    sto_AssetSettings_v1
{
    using CacheLib for CacheLib.Cache;

    /**
      @notice It returns the cToken address associated with an asset.
      @param assetAddress asset address to get the associated cToken for.
      @return The associated cToken address
      */
    function getCTokenAddress(address assetAddress)
        external
        view
        returns (address)
    {
        require(assetAddress != address(0x0), "ASSET_ADDRESS_REQUIRED");

        return
            getAssetSettings().assets[assetAddress].addresses[
                CTOKEN_ADDRESS_ASSET_SETTING
            ];
    }

    /**
      @notice It returns the pool together prize pool address associated with an asset.
      @param assetAddress asset address to get the associated aToken for.
      @return The associated prize pool address
      */
    function getPrizePoolAddress(address assetAddress)
        external
        view
        returns (address)
    {
        require(assetAddress != address(0x0), "PRIZE_POOL_ADDRESS_REQUIRED");

        return
            getAssetSettings().assets[assetAddress].addresses[
                PRIZE_POOL_ADDRESS_ASSET_SETTING
            ];
    }

    /**
      @notice Returns the max loan amount for a given asset.
      @param assetAddress asset address to retrieve the max loan amount.
      */
    function getMaxLoanAmount(address assetAddress)
        external
        view
        returns (uint256)
    {
        getAssetSettings().assets[assetAddress].requireExists();

        return
            getAssetSettings().assets[assetAddress].uints[
                MAX_LOAN_AMOUNT_ASSET_SETTING
            ];
    }
}
