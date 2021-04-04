// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../internal/asset-setting-names.sol";
import "../storage/asset-settings.sol";
import "../../../libraries/CacheLib.sol";
import "../../../libraries/AddressLib.sol";

abstract contract ext_AssetSettings_v1 is
    AssetSettingNames,
    sto_AssetSettings_v1
{
    using CacheLib for CacheLib.Cache;
    using AddressLib for address;

    /**
      @notice Returns the max debt ratio for a given asset.
      @dev The ratio value has 2 decimal places. I.e 100 = 1%
      @param assetAddress asset address to retrieve the max debt ratio.
      */
    function getMaxDebtRatio(address assetAddress)
        external
        view
        returns (uint256)
    {
        getAssetSettings().assets[assetAddress].requireExists();
        return
            getAssetSettings().assets[assetAddress].uints[
                MAX_DEBT_RATIO_SETTING
            ];
    }

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

    /**
      @notice Returns the max total value locked amount for a given asset.
      @param assetAddress asset address to retrieve the max total value locked amount.
      */
    function getMaxTVLAmount(address assetAddress)
        external
        view
        returns (uint256)
    {
        getAssetSettings().assets[assetAddress].requireExists();

        return
            getAssetSettings().assets[assetAddress].uints[
                MAX_TOTAL_VALUE_LOCKED_SETTING
            ];
    }

    /**
      @notice It returns the aToken address associated with an asset.
      @param assetAddress asset address to get the associated aToken for.
      @return The associated aToken address
      */
    function getATokenAddress(address assetAddress)
        external
        view
        returns (address)
    {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");

        return
            getAssetSettings().assets[assetAddress].addresses[
                ATOKEN_ADDRESS_ASSET_SETTING
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
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");

        return
            getAssetSettings().assets[assetAddress].addresses[
                PRIZE_POOL_ADDRESS_ASSET_SETTING
            ];
    }

    /**
      @notice Tests whether a given amount is greater than the current max loan amount.
      @param assetAddress asset address used to return the max loan amount setting.
      @param amount the loan amount to check.
      @return true if the given amount is greater than the current max loan amount. Otherwise it returns false.
      */
    function exceedsMaxLoanAmount(address assetAddress, uint256 amount)
        external
        view
        returns (bool)
    {
        getAssetSettings().assets[assetAddress].requireExists();
        return
            amount >
            getAssetSettings().assets[assetAddress].uints[
                MAX_LOAN_AMOUNT_ASSET_SETTING
            ];
    }
}
