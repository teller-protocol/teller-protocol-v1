pragma solidity 0.5.17;

// External Libraries

// Common
import "./ATMGovernance.sol";
import "../util/AddressArrayLib.sol";
import "../base/TInitializable.sol";
import "../base/UpgradeableProxy.sol";

// Contracts
import "../atm/ATMToken.sol";

// Interfaces
import "./IATMGovernance.sol";
import "../atm/IATMFactory.sol";
import "../interfaces/SettingsInterface.sol";


/**
    @notice This contract will create upgradeable ATM instances.
    @author develop@teller.finance
 */
contract ATMFactory is IATMFactory, TInitializable {
    using AddressArrayLib for address[];
    using AddressLib for address;
    using Address for address;

    /**
        @notice It defines whether an ATM address exists or not.
            Example:
                address(0x1234...890) => true
                address(0x2345...890) => false
     */
    mapping(address => bool) public atms;

    // List of ATM instances
    address[] public atmsList;

    SettingsInterface public settings;

    modifier onlyOwner() {
        require(settings.hasPauserRole(msg.sender) == true, "SENDER_ISNT_ALLOWED");
        _;
    }

    /**
        @notice It creates a new ATM instance.
        @param name ATM token name.
        @param symbol ATM token symbol
        @param decimals ATM token decimals 
        @param cap ATM token max cap.
        @param maxVestingsPerWallet max vestings per wallet for the ATM token.
        @return the new ATM governance instance address.
     */
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
        return atmGovernanceProxyAddress;
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

    /**
        @notice Tests whether an address is an ATM instance or not.
        @param atmAddress address to test.
        @return true if the given address is an ATM. Otherwise it returns false.
     */
    function isATM(address atmAddress) external view returns (bool) {
        return atms[atmAddress];
    }

    /**
        @notice Gets the ATMs list.
        @return the list of ATMs.
     */
    function getATMs() external view returns (address[] memory) {
        return atmsList;
    }

    /**
        @notice It updates the current settings.
        @param newSettingsAddress the new setting address.
     */
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
