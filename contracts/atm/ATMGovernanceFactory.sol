pragma solidity 0.5.17;

// External Libraries
//import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Common
import "./ATMGovernance.sol";
import "../util/AddressArrayLib.sol";
import "../base/TInitializable.sol";
import "../base/UpgradeableProxy.sol";

// Contracts
//import "@openzeppelin/contracts-ethereum-package/contracts/access/roles/SignerRole.sol";
import "../atm/ATMToken.sol";

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

        bytes memory atmTokenInitData = abi.encodeWithSignature(
            "initialize(string,string,uint8,uint256,uint256)",
            name,
            symbol,
            decimals,
            cap,
            maxVestingsPerWallet
        );

        ATMToken atmTokenLogic = new ATMToken();
        UpgradeableProxy atmTokenProxy = new UpgradeableProxy(
            address(atmTokenLogic),
            owner,
            atmTokenInitData
        );
        address atmTokenProxyAddress = address(atmTokenProxy);

        bytes memory atmGovernanceInitData = abi.encodeWithSignature(
            "initialize(address,address)",
            atmTokenProxy,
            owner
        );
        ATMGovernance atmGovernanceLogic = new ATMGovernance();
        UpgradeableProxy atmGovernanceProxy = new UpgradeableProxy(
            address(atmGovernanceLogic),
            owner,
            atmGovernanceInitData
        );
        address atmGovernanceProxyAddress = address(atmGovernanceProxy);

        atms[atmGovernanceProxyAddress] = true;
        atmsList.add(atmGovernanceProxyAddress);

        // Emit new ATM created event.
        emit ATMCreated(msg.sender, atmGovernanceProxyAddress, atmTokenProxyAddress);
    }

    /**
        @notice Tests whether an address is an ATM instance or not.
        @param atmAddress address to test.
        @return true if the given address is an ATM. Otherwise it returns false.
     */
    function isATM(address atmAddress) external view returns (bool) {
        return atms[atmAddress];
    }

    function getATMs() external view returns (address[] memory) {
        return atmsList;
    }

    /**
        @notice It initializes this ATM Governance Factory instance.
        @param settingsAddress settings address.
     */
    function initialize(address settingsAddress) external isNotInitialized() {
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
