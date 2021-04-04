// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../internal/asset-setting-names.sol";
import "../internal/roles.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";
import "../../../contexts/access-control/storage.sol";
import "../storage/asset-settings.sol";
import "../storage/asset-registry.sol";
import "../../../../contracts/providers/compound/CErc20Interface.sol";
import "../../../libraries/CacheLib.sol";
import "../interfaces/IAssetSettings.sol";

abstract contract ent_AssetSettings_v1 is
    AssetSettingNames,
    Roles,
    sto_AccessControl,
    mod_authorized_AccessControl_v1,
    sto_AssetSettings_v1,
    sto_AssetRegistry_v1,
    IAssetSettings
{
    using CacheLib for CacheLib.Cache;

    /**
      @notice It creates an asset with the given parameters.
      @param assetAddress asset address used to create the new setting.
      @param cTokenAddress cToken address used to configure the asset setting.
      @param maxLoanAmount the initial max loan amount.
      @param maxTVLAmount the initial max total value locked amount.
      @param maxDebtRatio the initial max debt ratio amount.
      */
    function createAssetSetting(
        address assetAddress,
        address cTokenAddress,
        uint256 maxLoanAmount,
        uint256 maxTVLAmount,
        uint256 maxDebtRatio
    ) external override authorized(PAUSER, msg.sender) {
        require(assetAddress != address(0x0), "ASSET_ADDRESS_REQUIRED");
        require(cTokenAddress != address(0x0), "CTOKEN_ADDRESS_REQUIRED");

        if (
            assetAddress !=
            sto_AssetRegistry_v1.getAssetRegistry().addresses["ETH"]
        ) {
            (bool success, bytes memory decimalsData) =
                assetAddress.staticcall(abi.encodeWithSignature("decimals()"));
            require(
                success && decimalsData.length > 0,
                "DECIMALS_NOT_SUPPORTED"
            );
            require(
                CErc20Interface(cTokenAddress).underlying() == assetAddress,
                "UNDERLYING_ASSET_MISMATCH"
            );
        }

        s().assets[assetAddress].initialize();
        s().assets[assetAddress].updateAddress(
            CTOKEN_ADDRESS_ASSET_SETTING,
            cTokenAddress
        );
        if (maxLoanAmount > 0) {
            s().assets[assetAddress].updateUint(
                MAX_LOAN_AMOUNT_ASSET_SETTING,
                maxLoanAmount
            );
        }
        if (maxTVLAmount > 0) {
            s().assets[assetAddress].updateUint(
                MAX_TOTAL_VALUE_LOCKED_SETTING,
                maxTVLAmount
            );
        }
        if (maxDebtRatio > 0) {
            s().assets[assetAddress].updateUint(
                MAX_DEBT_RATIO_SETTING,
                maxDebtRatio
            );
        }

        emit AssetSettingsCreated(
            msg.sender,
            assetAddress,
            cTokenAddress,
            maxLoanAmount
        );
    }

    /**
      @notice It updates the cToken address associated with an asset.
      @param assetAddress asset address to configure.
      @param cTokenAddress the new cToken address to configure.
      */
    function updateCTokenAddress(address assetAddress, address cTokenAddress)
        external
        override
        authorized(PAUSER, msg.sender)
    {
        require(cTokenAddress != address(0x0), "CTOKEN_ADDRESS_REQUIRED");
        address oldCTokenAddress =
            s().assets[assetAddress].addresses[CTOKEN_ADDRESS_ASSET_SETTING];

        s().assets[assetAddress].updateAddress(
            CTOKEN_ADDRESS_ASSET_SETTING,
            cTokenAddress
        );

        emit AssetSettingsAddressUpdated(
            CTOKEN_ADDRESS_ASSET_SETTING,
            msg.sender,
            assetAddress,
            oldCTokenAddress,
            cTokenAddress
        );
    }

    /**
      @notice It updates the yearn vault address associated with an asset.
      @param assetAddress asset address to configure.
      @param yVaultAddress the new yVault address to configure.
      */
    function updateYVaultAddressSetting(
        address assetAddress,
        address yVaultAddress
    ) external override authorized(PAUSER, msg.sender) {
        s().assets[assetAddress].updateAddress(
            YEARN_VAULT_ADDRESS_ASSET_SETTING,
            yVaultAddress
        );
    }

    /**
      @notice It updates the aToken address associated with an asset.
      @param assetAddress asset address to configure.
      @param aTokenAddress the new aToken address to configure.
      */
    function updateATokenAddress(address assetAddress, address aTokenAddress)
        external
        override
        authorized(PAUSER, msg.sender)
    {
        require(aTokenAddress != address(0x0), "ATOKEN_ADDRESS_REQUIRED");
        address oldATokenAddress =
            s().assets[assetAddress].addresses[ATOKEN_ADDRESS_ASSET_SETTING];

        s().assets[assetAddress].updateAddress(
            ATOKEN_ADDRESS_ASSET_SETTING,
            aTokenAddress
        );

        emit AssetSettingsAddressUpdated(
            ATOKEN_ADDRESS_ASSET_SETTING,
            msg.sender,
            assetAddress,
            oldATokenAddress,
            aTokenAddress
        );
    }

    /**
      @notice It updates the pool together prize pool address associated with an asset.
      @param assetAddress asset address to configure.
      @param prizePoolAddress the new aToken address to configure.
      */
    function updatePrizePoolAddress(
        address assetAddress,
        address prizePoolAddress
    ) external override authorized(PAUSER, msg.sender) {
        require(
            prizePoolAddress != address(0x0),
            "PRIZE_POOL_ADDRESS_REQUIRED"
        );

        address oldPrizePoolAddress =
            s().assets[assetAddress].addresses[
                PRIZE_POOL_ADDRESS_ASSET_SETTING
            ];

        s().assets[assetAddress].updateAddress(
            PRIZE_POOL_ADDRESS_ASSET_SETTING,
            prizePoolAddress
        );

        emit AssetSettingsAddressUpdated(
            PRIZE_POOL_ADDRESS_ASSET_SETTING,
            msg.sender,
            assetAddress,
            oldPrizePoolAddress,
            prizePoolAddress
        );
    }

    /**
      @notice It updates the max loan amount for a given asset.
      @param assetAddress asset address used to update the max loan amount.
      @param newMaxLoanAmount the new max loan amount to set.
      */
    function updateMaxLoanAmount(address assetAddress, uint256 newMaxLoanAmount)
        external
        override
        authorized(PAUSER, msg.sender)
    {
        s().assets[assetAddress].requireExists();
        uint256 oldMaxLoanAmount =
            s().assets[assetAddress].uints[MAX_LOAN_AMOUNT_ASSET_SETTING];

        s().assets[assetAddress].updateUint(
            MAX_LOAN_AMOUNT_ASSET_SETTING,
            newMaxLoanAmount
        );

        emit AssetSettingsUintUpdated(
            MAX_LOAN_AMOUNT_ASSET_SETTING,
            msg.sender,
            assetAddress,
            oldMaxLoanAmount,
            newMaxLoanAmount
        );
    }

    /**
      @notice It updates the max total value locked amount for a given asset.
      @param assetAddress asset address used to update the max loan amount.
      @param newMaxTVLAmount the new max total vault locked amount to set.
      */
    function updateMaxTVL(address assetAddress, uint256 newMaxTVLAmount)
        external
        override
        authorized(PAUSER, msg.sender)
    {
        s().assets[assetAddress].requireExists();
        if (
            newMaxTVLAmount !=
            s().assets[assetAddress].uints[MAX_TOTAL_VALUE_LOCKED_SETTING]
        ) {
            s().assets[assetAddress].updateUint(
                MAX_TOTAL_VALUE_LOCKED_SETTING,
                newMaxTVLAmount
            );
        }
    }

    /**
      @notice It updates the max debt ratio for a given asset.
      @dev The ratio value has 2 decimal places. I.e 100 = 1%
      @param assetAddress asset address used to update the max debt ratio.
      @param newMaxDebtRatio the new max debt ratio to set.
      */
    function updateMaxDebtRatio(address assetAddress, uint256 newMaxDebtRatio)
        external
        override
        authorized(PAUSER, msg.sender)
    {
        s().assets[assetAddress].requireExists();
        if (
            newMaxDebtRatio !=
            s().assets[assetAddress].uints[MAX_DEBT_RATIO_SETTING]
        ) {
            s().assets[assetAddress].updateUint(
                MAX_DEBT_RATIO_SETTING,
                newMaxDebtRatio
            );
        }
    }

    /**
      @notice It removes a configuration for a given asset on the platform.
      @param assetAddress asset address to remove.
      */
    function removeAsset(address assetAddress)
        external
        override
        authorized(PAUSER, msg.sender)
    {
        s().assets[assetAddress].requireExists();
        s().assets[assetAddress].clearCache(
            [
                MAX_LOAN_AMOUNT_ASSET_SETTING,
                MAX_TOTAL_VALUE_LOCKED_SETTING,
                CTOKEN_ADDRESS_ASSET_SETTING,
                YEARN_VAULT_ADDRESS_ASSET_SETTING,
                PRIZE_POOL_ADDRESS_ASSET_SETTING
            ],
            [
                CacheLib.CacheType.Uint,
                CacheLib.CacheType.Uint,
                CacheLib.CacheType.Address,
                CacheLib.CacheType.Address,
                CacheLib.CacheType.Address
            ]
        );
        delete s().assets[assetAddress];
        emit AssetSettingsRemoved(msg.sender, assetAddress);
    }

    function s()
        internal
        pure
        returns (sto_AssetSettings_v1.AssetSettingsLayout storage l_)
    {
        l_ = sto_AssetSettings_v1.getAssetSettings();
    }
}
