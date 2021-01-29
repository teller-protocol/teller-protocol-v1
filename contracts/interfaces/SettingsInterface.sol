pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/PlatformSettingsLib.sol";
import "./EscrowFactoryInterface.sol";
import "./LogicVersionsRegistryInterface.sol";
import "../settings/IATMSettings.sol";
import "../util/SettingsConsts.sol";
import "../providers/chainlink/IChainlinkAggregator.sol";
import "../interfaces/AssetSettingsInterface.sol";
import "./MarketFactoryInterface.sol";

/**
    @notice This interface defines all function to manage the platform configuration.

    @author develop@teller.finance
 */
interface SettingsInterface {
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
  event LendingPoolPaused(address indexed account, address indexed lendingPoolAddress);

  /**
        @notice This event is emitted when a lending pool is unpaused.
        @param account address that paused the lending pool.
        @param lendingPoolAddress lending pool address which was unpaused.
     */
  event LendingPoolUnpaused(address indexed account, address indexed lendingPoolAddress);

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

  function consts() external view returns (SettingsConsts);

  function assetSettings() external view returns (AssetSettingsInterface);

  /**
        @notice It updates an existent platform setting given a setting name.
        @notice It only allows to update the value (not the min or max values).
        @notice In case you need to update the min or max values, you need to remove it, and create it again.
        @param settingName setting name to update.
        @param newValue the new value to set.
     */
  function updatePlatformSetting(bytes32 settingName, uint256 newValue) external;

  /**
        @notice Removes a current platform setting given a setting name.
        @param settingName to remove.
     */
  function removePlatformSetting(bytes32 settingName) external;

  /**
        @notice It gets the current platform setting for a given setting name
        @param settingName to get.
        @return the current platform setting.
     */
  function getPlatformSetting(bytes32 settingName)
    external
    view
    returns (PlatformSettingsLib.PlatformSetting memory);

  /**
        @notice It gets the current platform setting value for a given setting name
        @param settingName to get.
        @return the current platform setting value.
     */
  function getPlatformSettingValue(bytes32 settingName) external view returns (uint256);

  /**
        @notice It tests whether a setting name is already configured.
        @param settingName setting name to test.
        @return true if the setting is already configured. Otherwise it returns false.
     */
  function hasPlatformSetting(bytes32 settingName) external view returns (bool);

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
  function lendingPoolPaused(address lendingPoolAddress) external view returns (bool);

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
        @notice Get the current EscrowFactory contract.
        @return the current EscrowFactory contract.
     */
  function escrowFactory() external view returns (EscrowFactoryInterface);

  function versionsRegistry() external view returns (LogicVersionsRegistryInterface);

  /**
        @notice It is the global instance of the ChainlinkAggregator contract.
     */
  function chainlinkAggregator() external view returns (IChainlinkAggregator);

  /**
        @notice It is the global instance of the MarketFactory contract.
     */
  function marketFactory() external view returns (MarketFactoryInterface);

  /**
        @notice Get the current ATMSetting contract.
        @return the current AtmSetting contract.
     */
  function atmSettings() external view returns (IATMSettings);

  /**
        @notice Gets the cToken address for a given asset address.
        @param assetAddress token address.
        @return the cToken address for a given asset address.
     */
  function getCTokenAddress(address assetAddress) external view returns (address);

  /**
        @notice It initializes this settings contract instance.
        @param versionsRegistryLogicAddress LogicVersionsRegistry logic address.
        @param wethTokenAddress canonical WETH token address.
        @param cethTokenAddress compound CETH token address.
     */
  function initialize(
    address versionsRegistryLogicAddress,
    address wethTokenAddress,
    address cethTokenAddress
  ) external;

  /**
        @notice It gets the ETH address used in the platform.
        @return the ETH address used in the platform.
     */
  function ETH_ADDRESS() external view returns (address);

  /**
        @notice It gets the canonical WETH address used in the platform.
        @return the canonical WETH address used in the platform.
     */
  function WETH_ADDRESS() external view returns (address);

  /**
        @notice It gets the canonical CETH address used in the platform.
        @return the canonical CETH address used in the platform.
     */
  function CETH_ADDRESS() external view returns (address);
}
