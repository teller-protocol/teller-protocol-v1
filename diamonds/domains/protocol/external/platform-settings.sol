// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/platform-settings.sol";
import "../internal/setting-names.sol";
import "../interfaces/IPlatformSettings.sol";
import "../../../contexts/access-control/context.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";
import "../../../contexts/pausable/modifiers/when-paused.sol";
import "../../../contexts/pausable/modifiers/when-not-paused.sol";
import "../internal/roles.sol";

abstract contract ext_PlatformSettings_v1 is
    sto_PlatformSettings_v1,
    SettingNames_v1,
    IPlatformSettings,
    mod_authorized_AccessControl_v1,
    mod_whenPaused_Pausable_v1,
    mod_whenNotPaused_Pausable_v1,
    int_grantRole_AccessControl_v1,
    Roles
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
        return s().platformSettings[settingName].exists;
    }

    function getPlatformSetting(bytes32 settingName)
        external
        view
        returns (PlatformSettingsLib.PlatformSetting memory)
    {
        return s().platformSettings[settingName];
    }

    /**
        @notice It gets whether the platform is paused or not.
        @return true if platform is paused. Otherwise it returns false.
     */
    function isPaused() external view override returns (bool) {
        return pausableStorage().paused[address(this)];
    }

    function isMarketPaused(address market)
        external
        view
        override
        returns (bool)
    {
        return pausableStorage().paused[market];
    }

    /**
        @notice Restricts the use of the Teller protocol to authorized wallet addresses only
        @param restriction Bool turning the resitriction on or off
     */
    function restrictPlatform(bool restriction)
        external
        override
        authorized(PAUSER, msg.sender)
    {
        s().platformRestricted = restriction;
        emit PlatformRestricted(restriction, msg.sender);
    }

    /**
        @notice Returns whether the platform is restricted or not
        @return bool True if the platform is restricted, false if not
     */
    function isPlatformRestricted() external view override returns (bool) {
        return s().platformRestricted;
    }

    /**
        @notice Adds a wallet address to the list of authorized wallets
        @param account The wallet address of the user being authorized
     */
    function addAuthorizedAddress(address account)
        public
        override
        authorized(PAUSER, msg.sender)
    {
        _grantRole(USER, account);
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
            _grantRole(USER < addressesToAdd[i]);
        }
    }

    /**
        @notice Removes a wallet address from the list of authorized wallets
        @param account The wallet address of the user being unauthorized
     */
    function removeAuthorizedAddress(address account)
        external
        override
        authorized(PAUSER, msg.sender)
    {
        _revokeRole(USER, account);
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
        return _hasRole(USER, account) || _hasRole(PAUSER, account);
    }

    function s()
        private
        pure
        returns (sto_PlatformSettings_v1.PlatformSettingsLayout storage l_)
    {
        l_ = getPlatformSettings();
    }
}
