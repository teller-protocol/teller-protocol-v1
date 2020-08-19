pragma solidity 0.5.17;

// External Libraries

// Common
import "../util/AddressArrayLib.sol";
import "../base/TInitializable.sol";
import "../base/UpgradeableProxy.sol";

// Contracts

// Interfaces
import "../atm/IATMFactory.sol";
import "../interfaces/SettingsInterface.sol";
import "../settings/IATMSettings.sol";


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

    mapping(address => address) public atmTokens;

    // List of ATM instances
    address[] public atmsList;

    SettingsInterface public settings;

    IATMSettings public atmSettings;

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
        @param atmGovernanceLogic the atm governance instance address.
        @param atmTokenLogic the atm token instance address.
        @return the new ATM governance instance address.
     */
    function createATM(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 cap,
        uint256 maxVestingsPerWallet,
        address atmGovernanceLogic,
        address atmTokenLogic
    ) external onlyOwner() isInitialized() returns (address) {
        address owner = msg.sender;

        bytes memory atmGovernanceInitData = abi.encodeWithSignature(
            "initialize(address)",
            owner
        );
        UpgradeableProxy atmGovernanceProxy = new UpgradeableProxy(
            atmGovernanceLogic,
            owner,
            atmGovernanceInitData
        );
        address atmGovernanceProxyAddress = address(atmGovernanceProxy);

        bytes memory atmTokenInitData = abi.encodeWithSignature(
            "initialize(string,string,uint8,uint256,uint256,address,address)",
            name,
            symbol,
            decimals,
            cap,
            maxVestingsPerWallet,
            address(atmSettings),
            atmGovernanceProxyAddress
        );

        UpgradeableProxy atmTokenProxy = new UpgradeableProxy(
            atmTokenLogic,
            owner,
            atmTokenInitData
        );
        address atmTokenProxyAddress = address(atmTokenProxy);

        atms[atmGovernanceProxyAddress] = true;
        atmTokens[atmGovernanceProxyAddress] = atmTokenProxyAddress;
        atmsList.add(atmGovernanceProxyAddress);

        // Emit new ATM created event.
        emit ATMCreated(msg.sender, atmGovernanceProxyAddress, atmTokenProxyAddress);
        return atmGovernanceProxyAddress;
    }

    /**
        @notice It initializes this ATM Governance Factory instance.
        @param settingsAddress settings address.
        @param atmSettingsAddress the ATM settings address.
     */
    function initialize(address settingsAddress, address atmSettingsAddress)
        external
        isNotInitialized()
    {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");
        require(atmSettingsAddress.isContract(), "ATM_SETTINGS_MUST_BE_A_CONTRACT");

        _initialize();

        settings = SettingsInterface(settingsAddress);
        atmSettings = IATMSettings(atmSettingsAddress);
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
        @notice Returns the atm token address of a given associated atm address.
        @param atmAddress ATM address to test
        @return Address of the associated ATM Token
     */
    function getATMToken(address atmAddress) external view returns (address) {
        return atmTokens[atmAddress];
    }

    /**
        @notice Returns the address of the ATM Settings contract.
        @return Address of the ATM settings contract
     */
    function getATMSettings() external view returns (address) {
        return address(atmSettings);
    }

    /**
        @notice Returns the address of the Settings contract
        @return Address of the settings contract
     */
    function getSettings() external view returns (address) {
        return address(settings);
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

    /**
        @notice It updates the current atm settings.
        @param newATMSettingsAddress The new settings address.
     */
    function setATMSettings(address newATMSettingsAddress) external onlyOwner() {
        require(newATMSettingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");
        address oldATMSettingsAddress = address(atmSettings);
        oldATMSettingsAddress.requireNotEqualTo(
            newATMSettingsAddress,
            "NEW_ATM_SETTINGS_NOT_PROVIDED"
        );

        atmSettings = IATMSettings(newATMSettingsAddress);

        emit ATMSettingsUpdated(msg.sender, oldATMSettingsAddress, newATMSettingsAddress);
    }
}
