// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import "../../../libraries/PlatformSettingsLib.sol";

// Interfaces
import "./IDappRegistry.sol";
import "./IPriceAggregator.sol";
import "./IAssetSettings.sol";
import "./IMarketFactory.sol";

/**
    @notice This interface defines all function to manage the platform configuration.

    @author develop@teller.finance
 */
interface ISettings {
    /**
     * @dev Emitted when the pause is triggered by a pauser (`account`).
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by a pauser (`account`).
     */
    event Unpaused(address account);

    event PauserAdded(address indexed account);
    event PauserRemoved(address indexed account);

    /**
        @notice This event is emitted when a new platform setting is created.
        @param settingName new setting name.
        @param sender address that created it.
        @param value value for the new setting.
     */
    event PlatformSettingCreated(
        bytes32 indexed settingName,
        address indexed sender,
        uint256 value,
        uint256 minValue,
        uint256 maxValue
    );

    /**
        @notice This event is emitted when a current platform setting is removed.
        @param settingName setting name removed.
        @param sender address that removed it.
     */
    event PlatformSettingRemoved(
        bytes32 indexed settingName,
        uint256 lastValue,
        address indexed sender
    );

    /**
        @notice This event is emitted when a platform setting is updated.
        @param settingName settings name updated.
        @param sender address that updated it.
        @param oldValue old value for the setting.
        @param newValue new value for the setting.
     */
    event PlatformSettingUpdated(
        bytes32 indexed settingName,
        address indexed sender,
        uint256 oldValue,
        uint256 newValue
    );

    /**
        @notice This event is emitted when a lending pool is paused.
        @param account address that paused the lending pool.
        @param lendingPoolAddress lending pool address which was paused.
     */
    event LendingPoolPaused(
        address indexed account,
        address indexed lendingPoolAddress
    );

    /**
        @notice This event is emitted when a lending pool is unpaused.
        @param account address that paused the lending pool.
        @param lendingPoolAddress lending pool address which was unpaused.
     */
    event LendingPoolUnpaused(
        address indexed account,
        address indexed lendingPoolAddress
    );

    /**
        @notice This event is emitted when the platform restriction is switched
        @param restriction Boolean representing the state of the restriction
        @param pauser address of the pauser flipping the switch
    */
    event PlatformRestricted(bool restriction, address indexed pauser);

    /**
        @notice This event is emitted when an address is given authorization
        @param user The address being authorized
        @param pauser address of the pauser adding the address
    */
    event AuthorizationGranted(address indexed user, address indexed pauser);

    /**
        @notice This event is emitted when an address has authorization revoked
        @param user The address being revoked
        @param pauser address of the pauser removing the address
    */
    event AuthorizationRevoked(address indexed user, address indexed pauser);

    /**
        @notice It creates a new platform setting given a setting name, value, min and max values.
        @param settingName setting name to create.
        @param value the initial value for the given setting name.
        @param minValue the min value for the setting.
        @param maxValue the max value for the setting.
     */
    function createPlatformSetting(
        bytes32 settingName,
        uint256 value,
        uint256 minValue,
        uint256 maxValue
    ) external;

    function assetSettings() external view returns (IAssetSettings);

    /**
     * @notice It holds the address of a deployed InitializeableDynamicProxy contract.
     * @dev It is used to deploy a new proxy contract with minimal gas cost using the logic in the Factory contract.
     */
    function initDynamicProxyLogic() external view returns (address);

    /**
        @notice It updates an existent platform setting given a setting name.
        @notice It only allows to update the value (not the min or max values).
        @notice In case you need to update the min or max values, you need to remove it, and create it again.
        @param settingName setting name to update.
        @param newValue the new value to set.
     */
    function updatePlatformSetting(bytes32 settingName, uint256 newValue)
        external;

    /**
        @notice Removes a current platform setting given a setting name.
        @param settingName to remove.
     */
    function removePlatformSetting(bytes32 settingName) external;

    /**
        @notice It gets the current "RequiredSubmissionsPercentage" setting's value
        @return value the current value.
     */
    function getRequiredSubmissionsPercentageValue()
        external
        view
        returns (uint256 value);

    /**
        @notice It gets the current "MaximumTolerance" setting's value
        @return value the current value.
     */
    function getMaximumToleranceValue() external view returns (uint256 value);

    /**
        @notice It gets the current "ResponseExpiryLength" setting's value
        @return value the current value.
     */
    function getResponseExpiryLengthValue()
        external
        view
        returns (uint256 value);

    /**
        @notice It gets the current "SafetyInterval" setting's value
        @return value the current value.
     */
    function getSafetyIntervalValue() external view returns (uint256 value);

    /**
        @notice It gets the current "TermsExpiryTime" setting's value
        @return value the current value.
     */
    function getTermsExpiryTimeValue() external view returns (uint256 value);

    /**
        @notice It gets the current "LiquidateEthPrice" setting's value
        @return value the current value.
     */
    function getLiquidateEthPriceValue() external view returns (uint256 value);

    /**
        @notice It gets the current "MaximumLoanDuration" setting's value
        @return value the current value.
     */
    function getMaximumLoanDurationValue()
        external
        view
        returns (uint256 value);

    /**
        @notice It gets the current "RequestLoanTermsRateLimit" setting's value
        @return value the current value.
     */
    function getRequestLoanTermsRateLimitValue()
        external
        view
        returns (uint256 value);

    /**
        @notice It gets the current "CollateralBuffer" setting's value
        @return value the current value.
     */
    function getCollateralBufferValue() external view returns (uint256 value);

    /**
        @notice It gets the current "OverCollateralizedBuffer" setting's value
        @return value the current value.
     */
    function getOverCollateralizedBufferValue()
        external
        view
        returns (uint256 value);

    /**
     * @notice It returns the address of the UniswapV2Router.
     */
    function getUniswapV2RouterAddress() external view returns (address);

    /**
        @notice It tests whether a setting name is already configured.
        @param settingName setting name to test.
        @return true if the setting is already configured. Otherwise it returns false.
     */
    function hasPlatformSetting(bytes32 settingName)
        external
        view
        returns (bool);

    /**
        @notice It gets whether the platform is paused or not.
        @return true if platform is paused. Otherwise it returns false.
     */
    function isPaused() external view returns (bool);

    /**
        @notice It gets whether a lending pool is paused or not.
        @param lendingPoolAddress lending pool address to test.
        @return true if the lending pool is paused. Otherwise it returns false.
     */
    function lendingPoolPaused(address lendingPoolAddress)
        external
        view
        returns (bool);

    /**
        @notice It pauses a specific lending pool.
        @param lendingPoolAddress lending pool address to pause.
     */
    function pauseLendingPool(address lendingPoolAddress) external;

    /**
        @notice It unpauses a specific lending pool.
        @param lendingPoolAddress lending pool address to unpause.
     */
    function unpauseLendingPool(address lendingPoolAddress) external;

    function platformSettings(bytes32)
        external
        view
        returns (PlatformSettingsLib.PlatformSetting memory);

    /**
        @notice Tests whether an account has the pauser role.
        @param account account to test.
        @return true if account has the pauser role. Otherwise it returns false.
     */
    function isPauser(address account) external view returns (bool);

    /**
        @notice Requires an account to have the pauser role.
        @param account account to test.
     */
    function requirePauserRole(address account) external view;

    /**
        @notice Restricts the use of the Teller protocol to authorized wallet addresses only
        @param restriction Bool turning the resitriction on or off
     */
    function restrictPlatform(bool restriction) external;

    /**
        @notice Adds a wallet address to the list of authorized wallets
        @param addressToAdd The wallet address of the user being authorized
     */
    function addAuthorizedAddress(address addressToAdd) external;

    /**
        @notice Adds a list of wallet addresses to the list of authorized wallets
        @param addressesToAdd The list of wallet addresses being authorized
     */
    function addAuthorizedAddressList(address[] calldata addressesToAdd)
        external;

    function addEscrowAuthorized(address escrowAddress) external;

    /**
        @notice Returns whether the platform is restricted or not
        @return bool True if the platform is restricted, false if not
     */
    function isPlatformRestricted() external view returns (bool);

    /**
        @notice Tests whether an account has authorization
        @param account The account address to check for
        @return True if account has authorization, false if it does not
     */
    function hasAuthorization(address account) external view returns (bool);

    /**
        @notice Requires an account to have platform authorization.
        @param account account to test.
     */
    function requireAuthorization(address account) external view;

    /**
        @notice Removes a wallet address from the list of authorized wallets
        @param addressToRemove The wallet address of the user being unauthorized
     */
    function removeAuthorizedAddress(address addressToRemove) external;

    /**
        @notice It is the global instance of the DappRegistry contract.
     */
    function dappRegistry() external view returns (IDappRegistry);

    /**
        @notice It is the global instance of the PriceAggregator contract.
     */
    function priceAggregator() external view returns (IPriceAggregator);

    /**
        @notice It is the global instance of the MarketFactory contract.
     */
    function marketFactory() external view returns (IMarketFactory);
}
