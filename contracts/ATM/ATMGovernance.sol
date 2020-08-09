pragma solidity 0.5.17;

// External Libraries
import "@openzeppelin/contracts/lifecycle/Pausable.sol";

// Common
import "../util/AddressArrayLib.sol";

// Contracts
import "@openzeppelin/contracts/access/roles/SignerRole.sol";

// Interfaces
import "./IATMGovernance.sol";

/**
    @notice This contract is used to modify Risk Settings, CRA or DataProviders for a specific ATM.
    @author develop@teller.finance
 */
contract ATMGovernance is Pausable, SignerRole, IATMGovernance {    
    
    using AddressArrayLib for address[];
    
    // List of general ATM settings. We accept properties equal to zero.
    // e.g.: supplyToDebtRatio  => percentage 50.44 = 5044
    mapping(bytes32 => uint256) public generalSettings;


    // List of Market specific Asset settings on this ATM
    // Asset address => Asset setting name => Asset setting value
    mapping(address => mapping(bytes32 => uint256)) public assetMarketSettings;


    // List of ATM Data providers 
    // max 256 data providers per ATM
    mapping(uint8 => address[]) public dataProviders;

    // Unique CRA - Credit Risk Algorithm github hash to use in this ATM 
    string public cra;    


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
        // onlySigner 
    {
        require(settingName != "", "GENERAL_SETTING_MUST_BE_PROVIDED");
        uint256 oldVersion = generalSettings[settingName];
        generalSettings[settingName] = newValue;
        emit GeneralSettingUpdated(msg.sender, settingName, oldVersion, newValue);
    }

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


}
