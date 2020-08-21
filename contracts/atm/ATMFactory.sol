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

    address public atmGovernanceTemplate;

    address public atmTokenTemplate;

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

        address atmGovernanceProxyAddress = _createATMGovernanceProxy(owner);

        address atmTokenProxyAddress = _createATMTokenProxy(
            name,
            symbol,
            decimals,
            cap,
            maxVestingsPerWallet,
            owner,
            atmGovernanceProxyAddress
        );

        atms[atmGovernanceProxyAddress] = true;
        atmTokens[atmGovernanceProxyAddress] = atmTokenProxyAddress;
        atmsList.add(atmGovernanceProxyAddress);

        // Emit new ATM created event.
        emit ATMCreated(msg.sender, atmGovernanceProxyAddress, atmTokenProxyAddress);
        return atmGovernanceProxyAddress;
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
        @notice It gets the current ATM Governance template used to create a new ATMGovernance proxy instance.
        @return the current ATM governance template address.
     */
    function getATMGovernanceTemplate() external view returns (address) {
        return address(atmGovernanceTemplate);
    }

    /**
        @notice It gets the current ATM Token template used to create a new ATMToken proxy instance.
        @return the current ATM token template address.
     */
    function getATMTokenTemplate() external view returns (address) {
        return address(atmTokenTemplate);
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
        @notice It sets a new ATM token template to be used in the proxy (see createATM function).
        @param newATMTokenTemplateAddress the new ATM token template address.
     */
    function setATMTokenTemplate(address newATMTokenTemplateAddress)
        external
        onlyOwner()
    {
        require(newATMTokenTemplateAddress.isContract(), "ATM_TOKEN_MUST_BE_A_CONTRACT");
        address oldATMTokenTemplate = atmTokenTemplate;
        oldATMTokenTemplate.requireNotEqualTo(
            newATMTokenTemplateAddress,
            "NEW_ATM_TOKEN_MUST_BE_PROVIDED"
        );

        atmTokenTemplate = newATMTokenTemplateAddress;

        emit ATMTokenTemplateUpdated(
            msg.sender,
            oldATMTokenTemplate,
            newATMTokenTemplateAddress
        );
    }

    /**
        @notice It sets a new ATM governance template to be used in the proxy (see createATM function).
        @param newATMGovernanceTemplateAddress the new ATM governance template address.
     */
    function setATMGovernanceTemplate(address newATMGovernanceTemplateAddress)
        external
        onlyOwner()
    {
        require(
            newATMGovernanceTemplateAddress.isContract(),
            "ATM_GOV_MUST_BE_A_CONTRACT"
        );
        address oldATMGovernanceTemplate = atmGovernanceTemplate;
        oldATMGovernanceTemplate.requireNotEqualTo(
            newATMGovernanceTemplateAddress,
            "NEW_ATM_GOV_MUST_BE_PROVIDED"
        );

        atmGovernanceTemplate = newATMGovernanceTemplateAddress;

        emit ATMGovernanceTemplateUpdated(
            msg.sender,
            oldATMGovernanceTemplate,
            newATMGovernanceTemplateAddress
        );
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

    /**
        @notice It initializes this ATM Governance Factory instance.
        @param settingsAddress settings address.
        @param atmSettingsAddress the ATM settings address.
        @param atmTokenTemplateAddress the ATM token address used as a template for the proxy instance.
        @param atmGovernanceTemplateAddress the ATM governance address used as a template for the proxy instance.
     */
    function initialize(
        address settingsAddress,
        address atmSettingsAddress,
        address atmTokenTemplateAddress,
        address atmGovernanceTemplateAddress
    ) external isNotInitialized() {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");
        require(atmSettingsAddress.isContract(), "ATM_SETTINGS_MUST_BE_A_CONTRACT");
        require(atmTokenTemplateAddress.isContract(), "ATM_TOKEN_MUST_BE_A_CONTRACT");
        require(atmGovernanceTemplateAddress.isContract(), "ATM_GOV_MUST_BE_A_CONTRACT");

        _initialize();

        settings = SettingsInterface(settingsAddress);
        atmSettings = IATMSettings(atmSettingsAddress);
        atmTokenTemplate = atmTokenTemplateAddress;
        atmGovernanceTemplate = atmGovernanceTemplateAddress;
    }

    /** Internal Functions */

    /**
        @notice It creates a ATM Governance proxy instance.
        @param owner address associated to the ATM governance proxy.
        @return the new ATM governance proxy address.
     */
    function _createATMGovernanceProxy(address owner) internal returns (address) {
        bytes memory atmGovernanceInitData = abi.encodeWithSignature(
            "initialize(address)",
            owner
        );
        UpgradeableProxy atmGovernanceProxy = new UpgradeableProxy(
            atmGovernanceTemplate,
            owner,
            atmGovernanceInitData
        );
        return address(atmGovernanceProxy);
    }

    /**
        @notice It creates a ATM Token proxy instance.
        @param name ATM token name.
        @param symbol ATM token symbol
        @param decimals ATM token decimals 
        @param cap ATM token max cap.
        @param maxVestingsPerWallet max vestings per wallet for the ATM token.
        @param owner the owner address associated to the proxy.
        @param atmGovernanceProxyAddress the ATM governance proxy address associated to this ATM Token.
        @return the new ATM token proxy address.
     */
    function _createATMTokenProxy(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 cap,
        uint256 maxVestingsPerWallet,
        address owner,
        address atmGovernanceProxyAddress
    ) internal returns (address) {
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
            atmTokenTemplate,
            owner,
            atmTokenInitData
        );
        return address(atmTokenProxy);
    }
}
