pragma solidity 0.5.17;

// External Libraries
//import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Common
//import "./ATMGovernance.sol";
//import "../util/AddressLib.sol";
import "../util/AddressArrayLib.sol";
//import "../base/TInitializable.sol";

// Contracts
//import "@openzeppelin/contracts-ethereum-package/contracts/access/roles/SignerRole.sol";
//import "../atm/ATMToken.sol";

// Interfaces
//import "./IATMGovernance.sol";
import "../atm/ATMGovernanceFactoryInterface.sol";
import "../interfaces/SettingsInterface.sol";


/**
    @notice This contract will create upgradeable ATM instances.
    @author develop@teller.finance
 */
contract ATMGovernanceFactory is
    ATMGovernanceFactoryInterface //TInitializable
{
    using AddressArrayLib for address[];
    using AddressLib for address;
    using Address for address;

    // Map of ATM instances
    // ATMProxy address => isATM
    mapping(address => bool) public atms;

    // List of ATM instances
    address[] public atmList;

    event SettingsUpdated(
        address indexed signer,
        address oldSettings,
        address newSettings
    );

    event ATMAdded(address indexed signer, address indexed atm, address indexed atmToken);

    modifier onlyOwner() {
        require(settings.hasPauserRole(msg.sender) == true, "SENDER_ISNT_ALLOWED");
        _;
    }

    SettingsInterface public settings;

    function createATM(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 cap,
        uint256 maxVestingsPerWallet
    ) external onlyOwner() returns (address) {
        // Deploy ATM base contract
        // Create new ATM proxy
        // Set ATM v1
        //     //  constructor(
        //     // string memory _name,
        //     // string memory _symbol,
        //     // uint8 _decimals,
        //     // uint256 cap,
        //     // uint256 maxVestingsPerWallet
        //     // )
        // ATMToken token = new ATMToken();
        // ATMGovernance instance = new ATMGovernance();
        // instance.initialize(token);
        // atms.add(instance);
        // atmList.add(instance);
        // // emit event new ATM
    }

    function initialize(address settingsAddress) external onlyOwner() //isNotInitialized()
    {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");
        //_initialize();

        settings = SettingsInterface(settingsAddress);
    }

    function setSettings(address newSettingsAddress) external onlyOwner() {
        require(newSettingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");
        address oldSettingsAddress = address(settings);
        oldSettingsAddress.requireNotEqualTo(
            newSettingsAddress,
            "NEW_SETTINGS_MUST_BE_PROVIDED"
        );

        settings = SettingsInterface(newSettingsAddress);

        emit SettingsUpdated(msg.sender, oldSettingsAddress, newSettingsAddress);
    }
}
