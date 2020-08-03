pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/AssetSettingsLib.sol";


/**
    @notice This interface defines all function to manage the platform configuration.

    @author develop@teller.finance
 */
interface SettingsInterface {
    /**
        @notice This event is emitted when a setting is updated.
        @param settingName setting name updated.
        @param sender address that updated it.
        @param oldValue old value for the setting.
        @param newValue new value for the setting.
     */
    event SettingUpdated(
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
    event LendingPoolUnpaused(
        address indexed account,
        address indexed lendingPoolAddress
    );

    /**
        @notice This event is emmited when a new node component is added.
        @param account address that added this new component.
        @param componentName name of the added component.
        @param minVersion minimum version assigned to this new component.
     */
    event ComponentVersionCreated(
        address indexed account,
        bytes32 indexed componentName,
        uint32 minVersion
    );

    /**
        @notice This event is emmited when a node component is removed.
        @param account address that removed this component.
        @param componentName name of the component removed.
        @param previousVersion previous version this component had before being removed (set = 0).
     */
    event ComponentVersionRemoved(
        address indexed account,
        bytes32 indexed componentName,
        uint32 previousVersion
    );

    /**
        @notice This event is emmited when a node component version is updated.
        @param account address that updated this component version.
        @param componentName name of the updated node component.
        @param oldVersion version this node component had before updating it.
        @param newVersion new version set to this node component.
     */
    event ComponentVersionUpdated(
        address indexed account,
        bytes32 indexed componentName,
        uint32 oldVersion,
        uint32 newVersion
    );

    /**
        @notice This event is emitted when an new asset settings is created.
        @param sender the transaction sender address.
        @param assetAddress the asset address used to create the settings.
        @param cTokenAddress cToken address to configure for the asset.
        @param maxLoanAmount max loan amount to configure for the asset.
     */
    event AssetSettingsCreated(
        address indexed sender,
        address indexed assetAddress,
        address cTokenAddress,
        uint256 maxLoanAmount
    );

    /**
        @notice This event is emitted when an asset settings is removed.
        @param sender the transaction sender address.
        @param assetAddress the asset address used to remove the settings.
     */
    event AssetSettingsRemoved(address indexed sender, address indexed assetAddress);

    /**
        @notice This event is emitted when an asset settings (address type) is updated.
        @param assetSettingName asset setting name updated.
        @param sender the transaction sender address.
        @param assetAddress the asset address used to update the asset settings.
        @param oldValue old value used for the asset setting.
        @param newValue the value updated.
     */
    event AssetSettingsAddressUpdated(
        bytes32 indexed assetSettingName,
        address indexed sender,
        address indexed assetAddress,
        address oldValue,
        address newValue
    );

    /**
        @notice This event is emitted when an asset settings (uint256 type) is updated.
        @param assetSettingName asset setting name updated.
        @param sender the transaction sender address.
        @param assetAddress the asset address used to update the asset settings.
        @param oldValue old value used for the asset setting.
        @param newValue the value updated.
     */
    event AssetSettingsUintUpdated(
        bytes32 indexed assetSettingName,
        address indexed sender,
        address indexed assetAddress,
        uint256 oldValue,
        uint256 newValue
    );

    /**
        @notice Gets the required responses to process consensus values.
        @return the required submissions value.
     */
    function requiredSubmissions() external view returns (uint256);

    /**
        @notice Sets the required responses to process consensus values.
        @param newRequiredSubmissions the new required submissions value.
     */
    function setRequiredSubmissions(uint256 newRequiredSubmissions) external;

    /**
        @notice This is the maximum tolerance for the values submitted (by nodes) when they are aggregated (average). It is used in the consensus mechanisms.
        @notice This is a percentage value with 2 decimal places.
            i.e. maximumTolerance of 325 => tolerance of 3.25% => 0.0325 of value
            i.e. maximumTolerance of 0 => It means all the values submitted must be equals.
        @dev The max value is 100% => 10000
        @return the current maximum tolerance value.
     */
    function maximumTolerance() external view returns (uint256);

    /**
        @notice Sets a new value for maximum tolerance setting.
        @param newMaximumTolerance new maximum tolerance value.
     */
    function setMaximumTolerance(uint256 newMaximumTolerance) external;

    /**
        @notice This is the maximum time (in seconds) a node has to submit a response. After that time, the response is considered expired.
        @return the current expiry length value.
     */
    function responseExpiryLength() external view returns (uint256);

    /**
        @notice Sets a new value for the response expiry length setting.
        @param newResponseExpiryLength new response expiry length value.
     */
    function setResponseExpiryLength(uint256 newResponseExpiryLength) external;

    /**
        @notice This is the minimum time you need to wait (in seconds) between the last time you deposit collateral and you take out the loan.
        @notice It is used to avoid potential attacks using Flash Loans (AAVE) or Flash Swaps (Uniswap V2).
        @return the current safety interval value.
     */
    function safetyInterval() external view returns (uint256);

    /**
        @notice Sets a new value for the safety interval setting.
        @param newSafetyInterval new safety interval value.
    */
    function setSafetyInterval(uint256 newSafetyInterval) external;

    /**
        @notice This represents the time (in seconds) that loan terms will be available after requesting them.
        @notice After this time, the loan terms will expire and the borrower will need to request it again.
        @return the current terms expiry time.
     */
    function termsExpiryTime() external view returns (uint256);

    /**
        @notice Sets a new value for the terms expiry time setting.
        @param newTermsExpiryTime new terms expiry time value.
    */
    function setTermsExpiryTime(uint256 newTermsExpiryTime) external;

    /**
        @notice It represents the percentage value (with 2 decimal places) to liquidate loans.
            i.e. an ETH liquidation price at 95% is stored as 9500
        @return the current liquidate ETH price.
     */
    function liquidateEthPrice() external view returns (uint256);

    /**
        @notice Gets current maximum loan duration setting (in seconds).
        @return the current maximum loan duration value.
     */
    function maximumLoanDuration() external view returns (uint256);

    /**
        @notice Sets a new value for maximum loan duration setting (in seconds).
        @param newMaximumLoanDuration new maximum loan duration value.
     */
    function setMaximumLoanDuration(uint256 newMaximumLoanDuration) external;

    /**
        @notice Sets a new value for the liquidate ETH price setting.
        @param newLiquidateEthPrice new terms expiry time value.
    */
    function setLiquidateEthPrice(uint256 newLiquidateEthPrice) external;

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

    /**
        @notice Add a new Node Component with its version.
        @param componentName name of the component
        @param minVersion minimum component version supported
     */
    function createComponentVersion(bytes32 componentName, uint32 minVersion) external;

    /**
        @notice Set a new version for a Node Component.
        @param componentName name of the component
        @param newVersion minimum component version supported
     */
    function updateComponentVersion(bytes32 componentName, uint32 newVersion) external;

    /**
        @notice Remove a Node Component from the list.
        @param componentName name of the component to be removed.
     */
    function removeComponentVersion(bytes32 componentName) external;

    /**
        @notice Get the version of a specific node component.
        @param componentName name of the component to return the version.
        @return minimum version of the node component if exists or zero 0 if not found.
     */
    function getComponentVersion(bytes32 componentName) external view returns (uint32);

    /**
        @notice It creates a new asset settings in the platform.
        @param assetAddress asset address used to create the new setting.
        @param cTokenAddress cToken address used to configure the asset setting.
        @param maxLoanAmount the max loan amount used to configure the asset setting.
     */
    function createAssetSettings(
        address assetAddress,
        address cTokenAddress,
        uint256 maxLoanAmount
    ) external;

    /**
        @notice It removes all the asset settings for a specific asset address.
        @param assetAddress asset address used to remove the asset settings.
     */
    function removeAssetSettings(address assetAddress) external;

    /**
        @notice It updates the maximum loan amount for a specific asset address.
        @param assetAddress asset address to configure.
        @param newMaxLoanAmount the new maximum loan amount to configure.
     */
    function updateMaxLoanAmount(address assetAddress, uint256 newMaxLoanAmount) external;

    /**
        @notice It updates the cToken address for a specific asset address.
        @param assetAddress asset address to configure.
        @param newCTokenAddress the new cToken address to configure.
     */
    function updateCTokenAddress(address assetAddress, address newCTokenAddress) external;

    /**
        @notice Gets the current asset addresses list.
        @return the asset addresses list.
     */
    function getAssets() external view returns (address[] memory);

    /**
        @notice Get the current asset settings for a given asset address.
        @param assetAddress asset address used to get the current settings.
        @return the current asset settings.
     */
    function getAssetSettings(address assetAddress)
        external
        view
        returns (AssetSettingsLib.AssetSettings memory);

    /**
        @notice Tests whether amount exceeds the current maximum loan amount for a specific asset settings.
        @param assetAddress asset address to test the setting.
        @param amount amount to test.
        @return true if amount exceeds current max loan amout. Otherwise it returns false.
     */
    function exceedsMaxLoanAmount(address assetAddress, uint256 amount)
        external
        view
        returns (bool);
}
