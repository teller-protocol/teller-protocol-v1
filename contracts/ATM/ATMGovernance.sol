pragma solidity 0.5.17;

// Libraries
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
contract ATMGovernance is Pausable, SignerRole, ATMGovernanceInterface {

    
    // List of general ATM settings
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
        @notice Add a new General Setting to this ATM.
        @param settingName the name of the general setting.
        @param settingValue the value of the general setting.
     */
    function addGeneralSettings(bytes32 settingName, uint256 settingValue)
        external
        onlySigner
    {
        require(settingValue > 0, "INVALID_GENERAL_SETTING_VALUE");
        require(settingName != "", "GENERAL_SETTING_MUST_BE_PROVIDED");
        require(generalSettings[settingName] == 0, "GENERAL_SETTING_ALREADY_EXISTS");
        generalSettings[settingName] = settingValue;
        emit GeneralSettingCreated(msg.sender, settingName, settingValue);
    }    
}
