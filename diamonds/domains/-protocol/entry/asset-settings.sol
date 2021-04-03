// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../internal/asset-setting-names.sol";
import "../internal/roles.sol";
import "../../../contexts/#access-control/modifiers/authorized.sol";
import "../../../contexts/#access-control/storage.sol";
import "../storage.sol";
import "../data.sol";
import "../../../../contracts/providers/compound/CErc20Interface.sol";
import "../libraries/CacheLib.sol";
import "../interfaces/AssetSettingsInterface.sol";

abstract contract ent_AssetSettings_v1 is
    AssetSettingNames,
    Roles,
    sto_AccessControl_v1,
    mod_authorized_AccessControl_v1,
    sto_AssetSettings_v1,
    dat_AssetSettings_v1,
    sto_AssetRegistry_v1
{
    /**
      @notice It returns the cToken address associated with an asset.
      @param assetAddress asset address to get the associated cToken for.
      @return The associated cToken address
      */
    function getCTokenAddress(address assetAddress)
        external
        view
        override
        returns (address)
    {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");

        return s().assets[assetAddress].addresses[CTOKEN_ADDRESS_ASSET_SETTING];
    }

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
    ) external override authorized(PAUSER) {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");
        cTokenAddress.requireNotEmpty("CTOKEN_ADDRESS_REQUIRED");

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
        authorized(PAUSER)
    {
        cTokenAddress.requireNotEmpty("CTOKEN_ADDRESS_REQUIRED");
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
    ) external override authorized(PAUSER) {
        s().assets[assetAddress].updateAddress(
            YEARN_VAULT_ADDRESS_ASSET_SETTING,
            yVaultAddress
        );
    }

    /**
      @notice It returns the yearn vault address associated with an asset.
      @param assetAddress asset address to get the associated yearn vault address for.
      @return The address of the yearn vault.
      */
    function getYVaultAddress(address assetAddress)
        external
        view
        override
        returns (address)
    {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");

        return
            s().assets[assetAddress].addresses[
                YEARN_VAULT_ADDRESS_ASSET_SETTING
            ];
    }

    /**
      @notice It updates the aToken address associated with an asset.
      @param assetAddress asset address to configure.
      @param aTokenAddress the new aToken address to configure.
      */
    function updateATokenAddress(address assetAddress, address aTokenAddress)
        external
        override
        authorized(PAUSER)
    {
        aTokenAddress.requireNotEmpty("ATOKEN_ADDRESS_REQUIRED");
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
      @notice It returns the aToken address associated with an asset.
      @param assetAddress asset address to get the associated aToken for.
      @return The associated aToken address
      */
    function getATokenAddress(address assetAddress)
        external
        view
        override
        returns (address)
    {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");

        return s().assets[assetAddress].addresses[ATOKEN_ADDRESS_ASSET_SETTING];
    }

    /**
      @notice It updates the pool together prize pool address associated with an asset.
      @param assetAddress asset address to configure.
      @param prizePoolAddress the new aToken address to configure.
      */
    function updatePrizePoolAddress(
        address assetAddress,
        address prizePoolAddress
    ) external override authorized(PAUSER) {
        prizePoolAddress.requireNotEmpty("PRIZE_POOL_ADDRESS_REQUIRED");
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
      @notice It returns the pool together prize pool address associated with an asset.
      @param assetAddress asset address to get the associated aToken for.
      @return The associated prize pool address
      */
    function getPrizePoolAddress(address assetAddress)
        external
        view
        override
        returns (address)
    {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");

        return
            s().assets[assetAddress].addresses[
                PRIZE_POOL_ADDRESS_ASSET_SETTING
            ];
    }

    /**
      @notice It updates the max loan amount for a given asset.
      @param assetAddress asset address used to update the max loan amount.
      @param newMaxLoanAmount the new max loan amount to set.
      */
    function updateMaxLoanAmount(address assetAddress, uint256 newMaxLoanAmount)
        external
        override
        authorized(PAUSER)
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
      @notice Returns the max loan amount for a given asset.
      @param assetAddress asset address to retrieve the max loan amount.
      */
    function getMaxLoanAmount(address assetAddress)
        external
        view
        override
        returns (uint256)
    {
        s().assets[assetAddress].requireExists();

        return s().assets[assetAddress].uints[MAX_LOAN_AMOUNT_ASSET_SETTING];
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
        override
        returns (bool)
    {
        s().assets[assetAddress].requireExists();
        return
            amount >
            s().assets[assetAddress].uints[MAX_LOAN_AMOUNT_ASSET_SETTING];
    }

    /**
      @notice It updates the max total value locked amount for a given asset.
      @param assetAddress asset address used to update the max loan amount.
      @param newMaxTVLAmount the new max total vault locked amount to set.
      */
    function updateMaxTVL(address assetAddress, uint256 newMaxTVLAmount)
        external
        override
        authorized(PAUSER)
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
      @notice Returns the max total value locked amount for a given asset.
      @param assetAddress asset address to retrieve the max total value locked amount.
      */
    function getMaxTVLAmount(address assetAddress)
        external
        view
        override
        returns (uint256)
    {
        s().assets[assetAddress].requireExists();

        return s().assets[assetAddress].uints[MAX_TOTAL_VALUE_LOCKED_SETTING];
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
        authorized(PAUSER)
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
      @notice Returns the max debt ratio for a given asset.
      @dev The ratio value has 2 decimal places. I.e 100 = 1%
      @param assetAddress asset address to retrieve the max debt ratio.
      */
    function getMaxDebtRatio(address assetAddress)
        external
        view
        override
        returns (uint256)
    {
        s().assets[assetAddress].requireExists();
        return s().assets[assetAddress].uints[MAX_DEBT_RATIO_SETTING];
    }

    /**
      @notice It removes a configuration for a given asset on the platform.
      @param assetAddress asset address to remove.
      */
    function removeAsset(address assetAddress)
        external
        override
        authorized(PAUSER)
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
        returns (sto_AssetSettings_v1.Layout storage l_)
    {
        l_ = sto_AssetSettings_v1.getAssetSettings();
    }
}
