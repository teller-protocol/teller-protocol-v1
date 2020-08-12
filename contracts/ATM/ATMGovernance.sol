pragma solidity 0.5.17;

// External Libraries
import "@openzeppelin/contracts/lifecycle/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

// Common
import "../util/AddressArrayLib.sol";
import "../util/AddressLib.sol";

// Contracts
import "@openzeppelin/contracts/access/roles/SignerRole.sol";

// Interfaces
import "./IATMGovernance.sol";

/**
    @notice This contract is used to modify Risk Settings, CRA or DataProviders for a specific ATM.
    @author develop@teller.finance
 */
contract ATMGovernance is Pausable, SignerRole, IATMGovernance {    
    // TODO: REMOVE PAUSABLE

    using AddressArrayLib for address[];
    using AddressLib for address;
    using Address for address;

    // List of general ATM settings. We don't accept settings equal to zero.
    // Example: supplyToDebtRatio  => 5044 = percentage 50.44
    // Example: supplyToDebtRatio => 1 = percentage 00.01
    mapping(bytes32 => uint256) public generalSettings;


    // List of Market specific Asset settings on this ATM
    // Asset address => Asset setting name => Asset setting value
    mapping(address => mapping(bytes32 => uint256)) public assetMarketSettings;

    // List of ATM Data providers 
    // max 256 data providers per ATM
    mapping(uint8 => address[]) public dataProviders;

    // Unique CRA - Credit Risk Algorithm github hash to use in this ATM 
    string public cra;    

    /* External Functions */

    /**
        @notice Adds a new General Setting to this ATM.
        @param settingName name of the setting to be added.
        @param settingValue value of the setting to be added.
     */
    function addGeneralSetting(bytes32 settingName, uint256 settingValue)
        external
        onlySigner
        whenNotPaused
    {
        require(settingValue > 0, "GENERAL_SETTING_MUST_BE_POSITIVE");
        require(settingName != "", "GENERAL_SETTING_MUST_BE_PROVIDED");
        require(generalSettings[settingName] == 0, "GENERAL_SETTING_ALREADY_EXISTS");
        generalSettings[settingName] = settingValue;
        emit GeneralSettingAdded(msg.sender, settingName, settingValue);
    }    
    
    /**
        @notice Updates an existing General Setting on this ATM.
        @param settingName name of the setting to be modified.
        @param newValue new value to be set for this settingName. 
     */
    function updateGeneralSetting(bytes32 settingName, uint256 newValue)
        external
        onlySigner
        whenNotPaused 
    {
        require(newValue > 0, "GENERAL_SETTING_MUST_BE_POSITIVE");
        require(settingName != "", "GENERAL_SETTING_MUST_BE_PROVIDED");
        uint256 oldVersion = generalSettings[settingName];
        generalSettings[settingName] = newValue;
        emit GeneralSettingUpdated(msg.sender, settingName, oldVersion, newValue);
    }

    /**
        @notice Removes a General Setting from this ATM.
        @param settingName name of the setting to be removed.
     */
    function removeGeneralSetting(bytes32 settingName)
        external 
        onlySigner
        whenNotPaused
    {
        require(settingName != "", "GENERAL_SETTING_MUST_BE_PROVIDED");
        require(generalSettings[settingName] > 0, "GENERAL_SETTING_NOT_FOUND");
        uint256 previousValue = generalSettings[settingName];
        delete generalSettings[settingName];
        emit GeneralSettingRemoved(msg.sender, settingName, previousValue);
    }

    /**
        @notice Adds a new Asset Setting from a specific Market on this ATM.
        @param asset market specific asset address.
        @param settingName name of the setting to be added.
        @param settingValue value of the setting to be added.
     */
    function addAssetMarketSetting(address asset, bytes32 settingName, uint256 settingValue)
        external
        onlySigner
        whenNotPaused
    {
        asset.requireNotEmpty("ASSET_ADDRESS_IS_REQUIRED");
        require(asset.isContract(), "ASSET_MUST_BE_A_CONTRACT");
        require(settingValue > 0, "ASSET_SETTING_MUST_BE_POSITIVE");
        require(settingName != "", "ASSET_SETTING_MUST_BE_PROVIDED");
        require(assetMarketSettings[asset][settingName] == 0, "ASSET_SETTING_ALREADY_EXISTS");
        assetMarketSettings[asset][settingName] = settingValue;
        emit AssetMarketSettingAdded(msg.sender, asset, settingName, settingValue);
    }

    /**
        @notice Updates an existing Asset Setting from a specific Market on this ATM.
        @param asset market specific asset address.
        @param settingName name of the setting to be added.
        @param newValue value of the setting to be added.
     */
    function updateAssetMarketSetting(address asset, bytes32 settingName, uint256 newValue)
        external
        onlySigner
        whenNotPaused
    {
        require(settingName != "", "ASSET_SETTING_MUST_BE_PROVIDED");
        require(assetMarketSettings[asset][settingName] > 0, "ASSET_SETTING_NOT_FOUND");
        require(
            newValue != assetMarketSettings[asset][settingName],
            "NEW_VALUE_SAME_AS_OLD"
        );
        uint256 oldValue = assetMarketSettings[asset][settingName];
        assetMarketSettings[asset][settingName] = newValue;
        emit AssetMarketSettingUpdated(msg.sender, asset, settingName, oldValue, newValue);
    }


    /**
        @notice Removes an existing Asset Setting from a specific Market on this ATM.
        @param asset market specific asset address.
        @param settingName name of the setting to be added.
     */
    function removeAssetMarketSetting(address asset, bytes32 settingName)
        external
        onlySigner
        whenNotPaused
    {
        require(settingName != "", "ASSET_SETTING_MUST_BE_PROVIDED");
        require(assetMarketSettings[asset][settingName] > 0, "ASSET_SETTING_NOT_FOUND");
        uint256 oldValue = assetMarketSettings[asset][settingName];
        delete assetMarketSettings[asset][settingName];
        emit AssetMarketSettingRemoved(msg.sender, asset, settingName, oldValue);
    }

    /* External Constant functions */

    /**
        @notice Returns a General Setting value from this ATM.
        @param settingName name of the setting to be returned.
     */
    function getGeneralSetting(bytes32 settingName)
        external
        view
        returns (uint256)
    {
        return generalSettings[settingName];
    }

    /**
        @notice Returns an existing Asset Setting value from a specific Market on this ATM.
        @param asset market specific asset address.
        @param settingName name of the setting to be returned.
     */
    function getAssetMarketSetting(address asset, bytes32 settingName)
        external
        view
        returns (uint256)
    {
        return assetMarketSettings[asset][settingName];
    }


}
