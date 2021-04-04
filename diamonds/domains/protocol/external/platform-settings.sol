// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/platform-settings.sol";
import "../internal/setting-names.sol";
import "../interfaces/IPlatformSettings.sol";

abstract contract ext_PlatformSettings_v1 is
    sto_PlatformSettings_v1,
    SettingNames_v1,
    IPlatformSettings
{
    /**
        @notice It gets the current "RequiredSubmissionsPercentage" setting's value
        @return value the current value.
     */
    function getRequiredSubmissionsPercentageValue()
        external
        view
        override
        returns (uint256 value)
    {
        value = s().platformSettings[REQUIRED_SUBMISSIONS_PERCENTAGE_SETTING]
            .value;
    }

    /**
        @notice It gets the current "MaximumTolerance" setting's value
        @return value the current value.
     */
    function getMaximumToleranceValue()
        external
        view
        override
        returns (uint256 value)
    {
        value = s().platformSettings[MAXIMUM_TOLERANCE_SETTING].value;
    }

    /**
        @notice It gets the current "ResponseExpiryLength" setting's value
        @return value the current value.
     */
    function getResponseExpiryLengthValue()
        external
        view
        override
        returns (uint256 value)
    {
        value = s().platformSettings[RESPONSE_EXPIRY_LENGTH_SETTING].value;
    }

    /**
        @notice It gets the current "SafetyInterval" setting's value
        @return value the current value.
     */
    function getSafetyIntervalValue()
        external
        view
        override
        returns (uint256 value)
    {
        value = s().platformSettings[SAFETY_INTERVAL_SETTING].value;
    }

    /**
        @notice It gets the current "TermsExpiryTime" setting's value
        @return value the current value.
     */
    function getTermsExpiryTimeValue()
        external
        view
        override
        returns (uint256 value)
    {
        value = s().platformSettings[TERMS_EXPIRY_TIME_SETTING].value;
    }

    /**
        @notice It gets the current "LiquidateEthPrice" setting's value
        @return value the current value.
     */
    function getLiquidateEthPriceValue()
        external
        view
        override
        returns (uint256 value)
    {
        value = s().platformSettings[LIQUIDATE_ETH_PRICE_SETTING].value;
    }

    /**
        @notice It gets the current "MaximumLoanDuration" setting's value
        @return value the current value.
     */
    function getMaximumLoanDurationValue()
        external
        view
        override
        returns (uint256 value)
    {
        value = s().platformSettings[MAXIMUM_LOAN_DURATION_SETTING].value;
    }

    /**
        @notice It gets the current "RequestLoanTermsRateLimit" setting's value
        @return value the current value.
     */
    function getRequestLoanTermsRateLimitValue()
        external
        view
        override
        returns (uint256 value)
    {
        value = s().platformSettings[REQUEST_LOAN_TERMS_RATE_LIMIT_SETTING]
            .value;
    }

    /**
        @notice It gets the current "CollateralBuffer" setting's value
        @return value the current value.
     */
    function getCollateralBufferValue()
        external
        view
        override
        returns (uint256 value)
    {
        value = s().platformSettings[COLLATERAL_BUFFER_SETTING].value;
    }

    /**
        @notice It gets the current "OverCollateralizedBuffer" setting's value
        @return value the current value.
     */
    function getOverCollateralizedBufferValue()
        external
        view
        override
        returns (uint256 value)
    {
        value = s().platformSettings[OVER_COLLATERALIZED_BUFFER_SETTING].value;
    }

    /**
     * @notice It returns the address of the UniswapV2Router.
     */
    function getUniswapV2RouterAddress()
        external
        view
        override
        returns (address)
    {
        return cacheStorage.addresses["UniswapV2Router"];
    }

    /**
     * @notice It returns the address of the InitializeableDynamicProxy contract.
     */
    function initDynamicProxyLogic() external view override returns (address) {
        return cacheStorage.addresses["InitializeableDynamicProxy"];
    }

    /**
        @notice It tests whether a setting name is already configured.
        @param settingName setting name to test.
        @return true if the setting is already configured. Otherwise it returns false.
     */
    function hasPlatformSetting(bytes32 settingName)
        external
        view
        override
        returns (bool)
    {
        return _getPlatformSetting(settingName).exists;
    }

    function getPlatformSetting(bytes32 settingName)
        external
        view
        returns (PlatformSettingsLib.PlatformSetting memory)
    {
        return _getPlatformSetting(settingName);
    }

    /**
        @notice It pauses a specific lending pool.
        @param lendingPoolAddress lending pool address to pause.
     */
    function pauseLendingPool(address lendingPoolAddress)
        external
        override
        onlyPauser
        whenNotPaused
    {
        lendingPoolAddress.requireNotEmpty("LENDING_POOL_IS_REQUIRED");
        require(
            !lendingPoolPaused[lendingPoolAddress],
            "LENDING_POOL_ALREADY_PAUSED"
        );

        lendingPoolPaused[lendingPoolAddress] = true;

        emit LendingPoolPaused(msg.sender, lendingPoolAddress);
    }

    /**
        @notice It unpauses a specific lending pool.
        @param lendingPoolAddress lending pool address to unpause.
     */
    function unpauseLendingPool(address lendingPoolAddress)
        external
        override
        onlyPauser
        whenNotPaused
    {
        lendingPoolAddress.requireNotEmpty("LENDING_POOL_IS_REQUIRED");
        require(
            lendingPoolPaused[lendingPoolAddress],
            "LENDING_POOL_IS_NOT_PAUSED"
        );

        lendingPoolPaused[lendingPoolAddress] = false;

        emit LendingPoolUnpaused(msg.sender, lendingPoolAddress);
    }

    /**
        @notice It gets whether the platform is paused or not.
        @return true if platform is paused. Otherwise it returns false.
     */
    function isPaused() external view override returns (bool) {
        return paused;
    }

    /**
        @notice Tests whether amount exceeds the current maximum loan amount for a specific asset settings.
        @param assetAddress asset address to test the setting.
        @param amount amount to test.
        @return true if amount exceeds current max loan amout. Otherwise it returns false.
     */
    function exceedsMaxLoanAmount(address assetAddress, uint256 amount)
        external
        view
        returns (bool)
    {
        return assetSettings.exceedsMaxLoanAmount(assetAddress, amount);
    }

    /**
        @notice Gets the cToken address for a given asset address.
        @param assetAddress token address.
        @return the cToken address for a given asset address.
     */
    function getCTokenAddress(address assetAddress)
        external
        view
        override
        returns (address)
    {
        return assetSettings.getCTokenAddress(assetAddress);
    }

    /**
        @notice Requires an account to have the pauser role.
        @param account account to test.
     */
    function requirePauserRole(address account) public view override {
        require(isPauser(account) || account == address(this), "NOT_PAUSER");
    }

    /**
        @notice Restricts the use of the Teller protocol to authorized wallet addresses only
        @param restriction Bool turning the resitriction on or off
     */
    function restrictPlatform(bool restriction) external override onlyPauser {
        platformRestricted = restriction;
        emit PlatformRestricted(restriction, msg.sender);
    }

    /**
        @notice Returns whether the platform is restricted or not
        @return bool True if the platform is restricted, false if not
     */
    function isPlatformRestricted() external view override returns (bool) {
        return platformRestricted;
    }

    /**
        @notice Adds a wallet address to the list of authorized wallets
        @param addressToAdd The wallet address of the user being authorized
     */
    function addAuthorizedAddress(address addressToAdd) public override {
        require(
            isPauser(msg.sender) || msg.sender == address(dappRegistry),
            "CALLER_NOT_PAUSER"
        );
        authorizedAddresses[addressToAdd] = true;
        emit AuthorizationGranted(addressToAdd, msg.sender);
    }

    /**
        @notice Adds a list of wallet addresses to the list of authorized wallets
        @param addressesToAdd The list of wallet addresses being authorized
     */
    function addAuthorizedAddressList(address[] calldata addressesToAdd)
        external
        override
        authorized(PAUSER, msg.sender)
    {
        for (uint256 i = 0; i < addressesToAdd.length; i++) {
            _addAuthorizedAddress(addressesToAdd[i]);
        }
    }

    /**
        @notice Removes a wallet address from the list of authorized wallets
        @param addressToRemove The wallet address of the user being unauthorized
     */
    function removeAuthorizedAddress(address addressToRemove)
        external
        override
        authorized(PAUSER, msg.sender)
    {
        s().authorizedAddresses[addressToRemove] = false;
        emit AuthorizationRevoked(addressToRemove, msg.sender);
    }

    /**
        @notice Tests whether an account has authorization
        @param account The account address to check for
        @return True if account has authorization, false if it does not
     */
    function hasAuthorization(address account)
        external
        view
        override
        returns (bool)
    {
        return _isPauser(account) || s().authorizedAddresses[account];
    }

    /**
        @notice Requires an account to have platform authorization.
        @dev Checks if an account address has authorization or proxy contract is registered.
        @param account account to test.
     */
    function requireAuthorization(address account) external view override {
        require(
            !s().platformRestricted ||
                _isPauser(account) ||
                s().authorizedAddresses[account],
            "NOT_AUTHORIZED"
        );
    }

    function s()
        private
        pure
        returns (sto_PlatformSettings_v1.PlatformSettingsLayout storage l_)
    {
        l_ = getPlatformSettings();
    }
}
