// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

contract CreateAssetSetting is Domain {
    function createAssetSetting(
        address assetAddress,
        address cTokenAddress,
        uint256 maxLoanAmount,
        uint256 maxTVLAmount,
        uint256 maxDebtRatio
    ) external override onlyPauser() {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");
        cTokenAddress.requireNotEmpty("CTOKEN_ADDRESS_REQUIRED");

        if (assetAddress != settings.ETH_ADDRESS()) {
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

        assets[assetAddress].initialize();
        assets[assetAddress].updateAddress(
            CTOKEN_ADDRESS_ASSET_SETTING,
            cTokenAddress
        );
        if (maxLoanAmount > 0) {
            assets[assetAddress].updateUint(
                MAX_LOAN_AMOUNT_ASSET_SETTING,
                maxLoanAmount
            );
        }
        if (maxTVLAmount > 0) {
            assets[assetAddress].updateUint(
                MAX_TOTAL_VALUE_LOCKED_SETTING,
                maxTVLAmount
            );
        }
        if (maxDebtRatio > 0) {
            assets[assetAddress].updateUint(
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
}
