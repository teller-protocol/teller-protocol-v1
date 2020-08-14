pragma solidity 0.5.17;

// External Libraries
//import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Common
//import "./ATMGovernance.sol";
//import "../util/AddressLib.sol";
import "../util/AddressArrayLib.sol";
import "../base/TInitializable.sol";

// Contracts
//import "@openzeppelin/contracts-ethereum-package/contracts/access/roles/SignerRole.sol";
//import "../atm/ATMToken.sol";

// Interfaces
import "./IATMGovernance.sol";
import "../atm/ATMGovernanceFactoryInterface.sol";
import "../interfaces/SettingsInterface.sol";


/**
    @notice This contract will create upgradeable ATM instances.
    @author develop@teller.finance
 */
contract ATMGovernanceFactory is ATMGovernanceFactoryInterface, TInitializable {
    using AddressArrayLib for address[];
    using AddressLib for address;
    using Address for address;

    // Map of ATM instances
    // ATMProxy address => isATM
    mapping(address => bool) public atms;

    // List of ATM instances
    address[] public atmsList;

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
    ) external onlyOwner() isInitialized() returns (address) {
        address owner = msg.sender;
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
        bytes memory atmTokenInitData = abi.encodeWithSignature(
            "initialize(string,string,uint8,uint256,uint256)",
            name,
            symbol,
            decimals,
            cap,
            maxVestingsPerWallet
        );
        address newATMToken = address(0x0);

        bytes memory atmGovernanceInitData = abi.encodeWithSignature("initialize(address, address)", newATMToken, owner);
        address newATMGovernance = address(0x0);
        

        atms[newATMGovernance] = true;
        atmsList.add(newATMGovernance);

        // Emit new ATM created event.
        emit ATMCreated(msg.sender, newATMGovernance, newATMToken);
    }

    function initialize(address settingsAddress) external onlyOwner() isNotInitialized() {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");

        _initialize();

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
