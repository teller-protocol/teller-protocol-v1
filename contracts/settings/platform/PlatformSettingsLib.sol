// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AppStorageLib } from "../../storage/app.sol";
import "./names.sol" as NAMES;

// It defines a platform settings. It includes: value, min, and max values.
struct PlatformSetting {
    uint256 value;
    uint256 min;
    uint256 max;
    bool exists;
}

/**
 * @notice Utility library of inline functions on the PlatformSetting struct.
 *
 * @author develop@teller.finance
 */
library PlatformSettingsLib {
    function s(bytes32 name) private pure returns (PlatatformSetting storage) {
        return AppStorageLib.store().platformSettings[name];
    }

    /**
     * @notice It gets the current "RequiredSubmissionsPercentage" setting's value
     * @return value the current value.
     */
    function getRequiredSubmissionsPercentageValue()
        internal
        view
        returns (uint256 value_)
    {
        value_ = s(NAMES.REQUIRED_SUBMISSIONS_PERCENTAGE).value;
    }

    /**
     * @notice It gets the current "MaximumTolerance" setting's value
     * @return value the current value.
     */
    function getMaximumToleranceValue() internal view returns (uint256 value_) {
        value_ = s(NAMES.MAXIMUM_TOLERANCE).value;
    }

    /**
     * @notice It gets the current "ResponseExpiryLength" setting's value
     * @return value the current value.
     */
    function getResponseExpiryLengthValue()
        internal
        view
        returns (uint256 value_)
    {
        value_ = s(NAMES.RESPONSE_EXPIRY_LENGTH).value;
    }

    /**
     * @notice It gets the current "SafetyInterval" setting's value
     * @return value the current value.
     */
    function getSafetyIntervalValue() internal view returns (uint256 value_) {
        value_ = s(NAMES.SAFETY_INTERVAL).value;
    }

    /**
     * @notice It gets the current "TermsExpiryTime" setting's value
     * @return value the current value.
     */
    function getTermsExpiryTimeValue() internal view returns (uint256 value_) {
        value_ = s(NAMES.TERMS_EXPIRY_TIME).value;
    }

    /**
     * @notice It gets the current "LiquidateEthPrice" setting's value
     * @return value the current value.
     */
    function getLiquidateEthPriceValue()
        internal
        view
        returns (uint256 value_)
    {
        value_ = s(NAMES.LIQUIDATE_ETH_PRICE).value;
    }

    /**
     * @notice It gets the current "MaximumLoanDuration" setting's value
     * @return value the current value.
     */
    function getMaximumLoanDurationValue()
        internal
        view
        returns (uint256 value_)
    {
        value_ = s(NAMES.MAXIMUM_LOAN_DURATION).value;
    }

    /**
     * @notice It gets the current "RequestLoanTermsRateLimit" setting's value
     * @return value the current value.
     */
    function getRequestLoanTermsRateLimitValue()
        internal
        view
        returns (uint256 value_)
    {
        value_ = s(NAMES.REQUEST_LOAN_TERMS_RATE_LIMIT).value;
    }

    /**
     * @notice It gets the current "CollateralBuffer" setting's value
     * @return value the current value.
     */
    function getCollateralBufferValue() internal view returns (uint256 value_) {
        value_ = s(NAMES.COLLATERAL_BUFFER).value;
    }

    /**
     * @notice It gets the current "OverCollateralizedBuffer" setting's value
     * @return value the current value.
     */
    function getOverCollateralizedBufferValue()
        internal
        view
        returns (uint256 value_)
    {
        value_ = s(NAMES.OVER_COLLATERALIZED_BUFFER).value;
    }

    /**
     * @notice It gets whether the platform is paused or not.
     * @return true if platform is paused. Otherwise it returns false.
     */
    function isPaused() internal view returns (bool) {
        return pausableStorage().paused[address(this)];
    }

    function isMarketPaused(address market) internal view returns (bool) {
        return pausableStorage().paused[market];
    }

    /**
     * @notice Returns whether the platform is restricted or not
     * @return bool True if the platform is restricted, false if not
     */
    function isPlatformRestricted() internal view returns (bool) {
        return s().platformRestricted;
    }

    /**
     * @notice Adds a wallet address to the list of authorized wallets
     * @param account The wallet address of the user being authorized
     */
    function addAuthorizedAddress(address account)
        public
        authorized(PAUSER, msg.sender)
    {
        _grantRole(USER, account);
    }

    /**
     * @notice Adds a list of wallet addresses to the list of authorized wallets
     * @param addressesToAdd The list of wallet addresses being authorized
     */
    function addAuthorizedAddressList(address[] calldata addressesToAdd)
        internal
        authorized(PAUSER, msg.sender)
    {
        for (uint256 i = 0; i < addressesToAdd.length; i++) {
            _grantRole(USER < addressesToAdd[i]);
        }
    }

    /**
     * @notice Removes a wallet address from the list of authorized wallets
     * @param account The wallet address of the user being unauthorized
     */
    function removeAuthorizedAddress(address account)
        internal
        authorized(PAUSER, msg.sender)
    {
        _revokeRole(USER, account);
    }

    /**
     * @notice Tests whether an account has authorization
     * @param account The account address to check for
     * @return True if account has authorization, false if it does not
     */
    function hasAuthorization(address account) internal view returns (bool) {
        return _hasRole(USER, account) || _hasRole(PAUSER, account);
    }
}
