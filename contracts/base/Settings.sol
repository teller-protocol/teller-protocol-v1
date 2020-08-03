pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts/lifecycle/Pausable.sol";

// Commons
import "@openzeppelin/contracts/utils/Address.sol";
import "../util/AddressLib.sol";
import "../util/AssetSettingsLib.sol";
import "../util/AddressArrayLib.sol";

// Interfaces

import "../interfaces/SettingsInterface.sol";


/**
    @notice This contract manages the configuration of the platform.

    @author develop@teller.finance
 */
contract Settings is Pausable, SettingsInterface {
    using AddressLib for address;
    using Address for address;
    using AssetSettingsLib for AssetSettingsLib.AssetSettings;
    using AddressArrayLib for address[];

    /** Constants */
    /**
        The maximum tolerance is a percentage with 2 decimals.
        Examples:
            350 => 3.5%
            4000 => 40.00%
        
        The max value is 100% => 10000
    */
    uint256 internal constant MAX_MAXIMUM_TOLERANCE_VALUE = 10000;

    /**
        @notice The setting name for the required subsmission settings.
     */
    bytes32 public constant REQUIRED_SUBMISSIONS_SETTING = "RequiredSubmissions";
    /**
        @notice The setting name for the maximum tolerance settings.
     */
    bytes32 public constant MAXIMUM_TOLERANCE_SETTING = "MaximumTolerance";
    /**
        @notice The setting name for the response expiry length settings.
     */
    bytes32 public constant RESPONSE_EXPIRY_LENGTH_SETTING = "ResponseExpiryLength";
    /**
        @notice The setting name for the safety interval settings.
     */
    bytes32 public constant SAFETY_INTERVAL_SETTING = "SafetyInterval";
    /**
        @notice The setting name for the term expiry time settings.
     */
    bytes32 public constant TERMS_EXPIRY_TIME_SETTING = "TermsExpiryTime";
    /**
        @notice The setting name for the liquidate ETH price settings.
     */
    bytes32 public constant LIQUIDATE_ETH_PRICE_SETTING = "LiquidateEthPrice";
    /**
        @notice The setting name for the maximum loan duration settings.
     */
    bytes32 public constant MAXIMUM_LOAN_DURATION_SETTING = "MaximumLoanDuration";
    /**
        @notice The asset setting name for the maximum loan amount settings.
     */
    bytes32 public constant MAX_LOAN_AMOUNT_ASSET_SETTING = "MaxLoanAmount";
    /**
        @notice The asset setting name for cToken address settings.
     */
    bytes32 public constant CTOKEN_ADDRESS_ASSET_SETTING = "CTokenAddress";

    /* State Variables */

    /**
        @notice It represents a mapping to identify the lending pools paused and not paused.

        i.e.: address(lending pool) => true or false.
     */
    mapping(address => bool) public lendingPoolPaused;

    /**
        @notice Contains minimum version for each node component.

        i.e.: "web2" => "1234500" represents "web2" => "01.23.45.00"
     */
    mapping(bytes32 => uint32) public minimumNodeRequirements;

    /**
        @notice It represents a mapping to configure the asset settings.
        @notice The key belongs to the asset address. Example: address(DAI) or address(USDC).
        @notice The value has the asset settings.

        Examples:

        address(DAI) => {
            cTokenAddress = 0x1234...890
            maxLoanAmount = 1000 DAI (max)
        }
        address(USDC) => {
            cTokenAddress = 0x2345...901
            maxLoanAmount = 500 USDC (max)
        }
     */
    mapping(address => AssetSettingsLib.AssetSettings) public assetSettings;

    /**
        @notice It contains all the current assets.
     */
    address[] public assets;

    /**
        It represents the total number of submissions required for consensus on a value.
     */
    uint256 public requiredSubmissions;

    /**
        This is the maximum tolerance (a percentage) when the values submitted for the nodes are aggregated.
        It is used to calculate the collateral ratio, interest rate, and others.
 
        This is a percentage with 2 decimal places.
        i.e. maximumTolerance of 325 => tolerance of 3.25% => 0.0325 of value
        i.e. maximumTolerance of 0 => It means all the values submitted must be equals.
     */
    uint256 public maximumTolerance;

    /**
        This is the maximum time (in seconds) a node has to submit a response. After that time, the response is considered expired.
     */
    uint256 public responseExpiryLength;

    /**
        This is the minimum time you need to wait (in seconds) between the last time you deposit collateral and you take out the loan.
        It is used to avoid potential attacks using Flash Loans (AAVE) or Flash Swaps (Uniswap V2).
     */
    uint256 public safetyInterval;

    /**
        This represents the time (in seconds) that loan terms will be available after requesting them.
        After this time, the loan terms will expire and the borrower will need to request it again.
     */
    uint256 public termsExpiryTime;

    /**
        It represents the percentage value (with 2 decimal places) to liquidate loans.
        
        i.e. an ETH liquidation price at 95% is stored as 9500
     */
    uint256 public liquidateEthPrice;
    /**
        It represents the maximum duration for a loan. It is defined in seconds.
     */
    uint256 public maximumLoanDuration;

    /** Modifiers */

    /* Constructor */

    /**
        @notice It creates a new Settings instance.
        @param aRequiredSubmissions the initial value for the required submissions setting.
        @param aMaximumTolerance the initial value for the maximum tolerance setting.
        @param aResponseExpiryLength the initial value for the response expiry length setting.
        @param aSafetyInterval the initial value for the safety interval setting.
        @param aTermsExpiryTime the initial value for the terms expiry time setting.
        @param aLiquidateEthPrice the initial value for the liquidate ETH price setting.
        @param aMaximumLoanDuration the initial value for the max loan duration setting.
     */
    constructor(
        uint256 aRequiredSubmissions,
        uint256 aMaximumTolerance,
        uint256 aResponseExpiryLength,
        uint256 aSafetyInterval,
        uint256 aTermsExpiryTime,
        uint256 aLiquidateEthPrice,
        uint256 aMaximumLoanDuration
    ) public {
        require(aRequiredSubmissions > 0, "MUST_PROVIDE_REQUIRED_SUBS");
        require(aResponseExpiryLength > 0, "MUST_PROVIDE_RESPONSE_EXP");
        require(aSafetyInterval > 0, "MUST_PROVIDE_SAFETY_INTERVAL");
        require(aTermsExpiryTime > 0, "MUST_PROVIDE_TERMS_EXPIRY");
        require(aLiquidateEthPrice > 0, "MUST_PROVIDE_ETH_PRICE");
        require(aMaximumLoanDuration > 0, "MUST_PROVIDE_MAX_LOAN_DURATION");

        requiredSubmissions = aRequiredSubmissions;
        maximumTolerance = aMaximumTolerance;
        responseExpiryLength = aResponseExpiryLength;
        safetyInterval = aSafetyInterval;
        termsExpiryTime = aTermsExpiryTime;
        liquidateEthPrice = aLiquidateEthPrice;
        maximumLoanDuration = aMaximumLoanDuration;
    }

    /** External Functions */

    /**
        @notice Sets the required responses to process consensus values.
        @param newRequiredSubmissions the new required submissions value.
     */
    function setRequiredSubmissions(uint256 newRequiredSubmissions)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(requiredSubmissions != newRequiredSubmissions, "NEW_VALUE_REQUIRED");
        require(newRequiredSubmissions > 0, "MUST_PROVIDE_REQUIRED_SUBS");
        uint256 oldRequiredSubmissions = requiredSubmissions;
        requiredSubmissions = newRequiredSubmissions;

        emit SettingUpdated(
            REQUIRED_SUBMISSIONS_SETTING,
            msg.sender,
            oldRequiredSubmissions,
            newRequiredSubmissions
        );
    }

    /**
        @notice This is the maximum tolerance for the values submitted (by nodes) when they are aggregated (average). It is used in the consensus mechanisms.
        @notice This is a percentage value with 2 decimal places.
            i.e. maximumTolerance of 325 => tolerance of 3.25% => 0.0325 of value
            i.e. maximumTolerance of 0 => It means all the values submitted must be equals.
        @dev The max value is 100% => 10000
        @param newMaximumTolerance new maximum tolerance value.
        @return the current maximum tolerance value.
     */
    function setMaximumTolerance(uint256 newMaximumTolerance)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(maximumTolerance != newMaximumTolerance, "NEW_VALUE_REQUIRED");
        require(
            newMaximumTolerance <= MAX_MAXIMUM_TOLERANCE_VALUE,
            "MAX_TOLERANCE_EXCEEDED"
        );
        uint256 oldMaximumTolerance = maximumTolerance;
        maximumTolerance = newMaximumTolerance;

        emit SettingUpdated(
            MAXIMUM_TOLERANCE_SETTING,
            msg.sender,
            oldMaximumTolerance,
            newMaximumTolerance
        );
    }

    /**
        @notice Sets a new value for the response expiry length setting.
        @param newResponseExpiryLength new response expiry length value.
     */
    function setResponseExpiryLength(uint256 newResponseExpiryLength)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(responseExpiryLength != newResponseExpiryLength, "NEW_VALUE_REQUIRED");
        require(newResponseExpiryLength > 0, "MUST_PROVIDE_RESPONSE_EXP");
        uint256 oldResponseExpiryLength = responseExpiryLength;
        responseExpiryLength = newResponseExpiryLength;

        emit SettingUpdated(
            RESPONSE_EXPIRY_LENGTH_SETTING,
            msg.sender,
            oldResponseExpiryLength,
            newResponseExpiryLength
        );
    }

    /**
        @notice Sets a new value for the safety interval setting.
        @param newSafetyInterval new safety interval value.
    */
    function setSafetyInterval(uint256 newSafetyInterval)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(safetyInterval != newSafetyInterval, "NEW_VALUE_REQUIRED");
        require(newSafetyInterval > 0, "MUST_PROVIDE_SAFETY_INTERVAL");
        uint256 oldSafetyInterval = safetyInterval;
        safetyInterval = newSafetyInterval;

        emit SettingUpdated(
            SAFETY_INTERVAL_SETTING,
            msg.sender,
            oldSafetyInterval,
            newSafetyInterval
        );
    }

    /**
        @notice Sets a new value for the terms expiry time setting.
        @param newTermsExpiryTime new terms expiry time value.
    */
    function setTermsExpiryTime(uint256 newTermsExpiryTime)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(termsExpiryTime != newTermsExpiryTime, "NEW_VALUE_REQUIRED");
        require(newTermsExpiryTime > 0, "MUST_PROVIDE_TERMS_EXPIRY");
        uint256 oldTermsExpiryTime = termsExpiryTime;
        termsExpiryTime = newTermsExpiryTime;

        emit SettingUpdated(
            TERMS_EXPIRY_TIME_SETTING,
            msg.sender,
            oldTermsExpiryTime,
            newTermsExpiryTime
        );
    }

    /**
        @notice Sets a new value for the liquidate ETH price setting.
        @param newLiquidateEthPrice new liquidate ETH price value.
    */
    function setLiquidateEthPrice(uint256 newLiquidateEthPrice)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(liquidateEthPrice != newLiquidateEthPrice, "NEW_VALUE_REQUIRED");
        require(newLiquidateEthPrice > 0, "MUST_PROVIDE_ETH_PRICE");
        uint256 oldLiquidateEthPrice = liquidateEthPrice;
        liquidateEthPrice = newLiquidateEthPrice;

        emit SettingUpdated(
            LIQUIDATE_ETH_PRICE_SETTING,
            msg.sender,
            oldLiquidateEthPrice,
            newLiquidateEthPrice
        );
    }

    /**
        @notice Sets a new value for maximum loan duration setting (in seconds).
        @param newMaximumLoanDuration new maximum loan duration value.
     */
    function setMaximumLoanDuration(uint256 newMaximumLoanDuration)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(maximumLoanDuration != newMaximumLoanDuration, "NEW_VALUE_REQUIRED");
        require(newMaximumLoanDuration > 0, "MUST_PROVIDE_MAXIMUM_LOAN_DURATION");
        uint256 oldMaximumLoanDuration = maximumLoanDuration;
        maximumLoanDuration = newMaximumLoanDuration;

        emit SettingUpdated(
            MAXIMUM_LOAN_DURATION_SETTING,
            msg.sender,
            oldMaximumLoanDuration,
            newMaximumLoanDuration
        );
    }

    /**
        @notice Add a new Node Component with its version.
        @param componentName name of the component to be added.
        @param minVersion minimum component version supported.
     */
    function createComponentVersion(bytes32 componentName, uint32 minVersion)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(minVersion > 0, "INVALID_COMPONENT_VERSION");
        require(componentName[0] != 0, "COMPONENT_NAME_MUST_BE_PROVIDED");
        require(minimumNodeRequirements[componentName] == 0, "COMPONENT_ALREADY_EXISTS");
        minimumNodeRequirements[componentName] = minVersion;
        emit ComponentVersionCreated(msg.sender, componentName, minVersion);
    }

    /**
        @notice Remove a Node Component from the list.
        @param componentName name of the component to be removed.
     */
    function removeComponentVersion(bytes32 componentName)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(componentName != "", "COMPONENT_NAME_MUST_BE_PROVIDED");
        require(minimumNodeRequirements[componentName] > 0, "COMPONENT_NOT_FOUND");
        uint32 previousVersion = minimumNodeRequirements[componentName];
        delete minimumNodeRequirements[componentName];
        emit ComponentVersionRemoved(msg.sender, componentName, previousVersion);
    }

    /**
        @notice Get the version of a specific node component.
        @param componentName name of the component to return the version.
        @return version of the node component if exists or zero 0 if not found.
     */
    function getComponentVersion(bytes32 componentName) external view returns (uint32) {
        return minimumNodeRequirements[componentName];
    }

    /**
        @notice Set a new version for a Node Component.
        @param componentName name of the component to be modified.
        @param newVersion minimum component version supported.
     */
    function updateComponentVersion(bytes32 componentName, uint32 newVersion)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(newVersion > 0, "INVALID_COMPONENT_VERSION");
        require(componentName != "", "COMPONENT_NAME_MUST_BE_PROVIDED");
        require(minimumNodeRequirements[componentName] > 0, "COMPONENT_NOT_FOUND");
        require(
            newVersion > minimumNodeRequirements[componentName],
            "NEW_VERSION_MUST_INCREASE"
        );
        uint32 oldVersion = minimumNodeRequirements[componentName];
        minimumNodeRequirements[componentName] = newVersion;
        emit ComponentVersionUpdated(
            msg.sender,
            componentName,
            oldVersion,
            newVersion
        );
    }

    /**
        @notice It pauses a specific lending pool.
        @param lendingPoolAddress lending pool address to pause.
     */
    function pauseLendingPool(address lendingPoolAddress)
        external
        onlyPauser()
        whenNotPaused()
    {
        lendingPoolAddress.requireNotEmpty("LENDING_POOL_IS_REQUIRED");
        require(!lendingPoolPaused[lendingPoolAddress], "LENDING_POOL_ALREADY_PAUSED");

        lendingPoolPaused[lendingPoolAddress] = true;

        emit LendingPoolPaused(msg.sender, lendingPoolAddress);
    }

    /**
        @notice It unpauses a specific lending pool.
        @param lendingPoolAddress lending pool address to unpause.
     */
    function unpauseLendingPool(address lendingPoolAddress)
        external
        onlyPauser()
        whenNotPaused()
    {
        lendingPoolAddress.requireNotEmpty("LENDING_POOL_IS_REQUIRED");
        require(lendingPoolPaused[lendingPoolAddress], "LENDING_POOL_IS_NOT_PAUSED");

        lendingPoolPaused[lendingPoolAddress] = false;

        emit LendingPoolUnpaused(msg.sender, lendingPoolAddress);
    }

    /**
        @notice It gets whether the platform is paused or not.
        @return true if platform is paused. Otherwise it returns false.
     */
    function isPaused() external view returns (bool) {
        return paused();
    }

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
    ) external onlyPauser() whenNotPaused() {
        require(assetAddress.isContract(), "ASSET_ADDRESS_MUST_BE_CONTRACT");

        assetSettings[assetAddress].requireNotExists();

        assetSettings[assetAddress].initialize(cTokenAddress, maxLoanAmount);

        assets.add(assetAddress);

        emit AssetSettingsCreated(msg.sender, assetAddress, cTokenAddress, maxLoanAmount);
    }

    /**
        @notice It removes all the asset settings for a specific asset address.
        @param assetAddress asset address used to remove the asset settings.
     */
    function removeAssetSettings(address assetAddress)
        external
        onlyPauser()
        whenNotPaused()
    {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_IS_REQUIRED");
        assetSettings[assetAddress].requireExists();

        delete assetSettings[assetAddress];
        assets.remove(assetAddress);

        emit AssetSettingsRemoved(msg.sender, assetAddress);
    }

    /**
        @notice It updates the maximum loan amount for a specific asset address.
        @param assetAddress asset address to configure.
        @param newMaxLoanAmount the new maximum loan amount to configure.
     */
    function updateMaxLoanAmount(address assetAddress, uint256 newMaxLoanAmount)
        external
        onlyPauser()
        whenNotPaused()
    {
        uint256 oldMaxLoanAmount = assetSettings[assetAddress].maxLoanAmount;

        assetSettings[assetAddress].updateMaxLoanAmount(newMaxLoanAmount);

        emit AssetSettingsUintUpdated(
            MAX_LOAN_AMOUNT_ASSET_SETTING,
            msg.sender,
            assetAddress,
            oldMaxLoanAmount,
            newMaxLoanAmount
        );
    }

    /**
        @notice It updates the cToken address for a specific asset address.
        @param assetAddress asset address to configure.
        @param newCTokenAddress the new cToken address to configure.
     */
    function updateCTokenAddress(address assetAddress, address newCTokenAddress)
        external
        onlyPauser()
        whenNotPaused()
    {
        address oldCTokenAddress = assetSettings[assetAddress].cTokenAddress;

        assetSettings[assetAddress].updateCTokenAddress(newCTokenAddress);

        emit AssetSettingsAddressUpdated(
            CTOKEN_ADDRESS_ASSET_SETTING,
            msg.sender,
            assetAddress,
            oldCTokenAddress,
            newCTokenAddress
        );
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
        return assetSettings[assetAddress].exceedsMaxLoanAmount(amount);
    }

    /**
        @notice Gets the current asset addresses list.
        @return the asset addresses list.
     */
    function getAssets() external view returns (address[] memory) {
        return assets;
    }

    /**
        @notice Get the current asset settings for a given asset address.
        @param assetAddress asset address used to get the current settings.
        @return the current asset settings.
     */
    function getAssetSettings(address assetAddress)
        external
        view
        returns (AssetSettingsLib.AssetSettings memory)
    {
        return assetSettings[assetAddress];
    }

    /** Internal functions */

    /** Private functions */
}
