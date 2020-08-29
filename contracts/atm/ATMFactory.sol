pragma solidity 0.5.17;

// External Libraries

// Common
import "../util/AddressArrayLib.sol";
import "../base/TInitializable.sol";

// Contracts
import "./ATMGovernanceProxy.sol";
import "./TLRTokenProxy.sol";

// Interfaces
import "../atm/ATMFactoryInterface.sol";
import "../settings/IATMSettings.sol";

/**
    @notice This contract will create upgradeable ATM instances.
    @author develop@teller.finance
 */
contract ATMFactory is BaseATM, ATMFactoryInterface, TInitializable {
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

    mapping(address => address) public tlrTokens;

    // List of ATM instances
    address[] public atmsList;

    /**
        @notice It creates a new ATM instance.
        @param name TLR token name.
        @param symbol TLR token symbol
        @param decimals TLR token decimals 
        @param cap TLR token max cap.
        @param maxVestingPerWallet max vesting per wallet for the ATM token.
        @return the new ATM governance instance address.
     */
    function createATM(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 cap,
        uint256 maxVestingPerWallet
    ) external onlyPauser() isInitialized() returns (address) {
        address atmSettingsAddress = address(atmSettings);

        ATMGovernanceProxy atmGovernanceProxy = new ATMGovernanceProxy(atmSettingsAddress);
        address atmGovernanceProxyAddress = address(atmGovernanceProxy);

        TLRTokenProxy tlrTokenProxy = new TLRTokenProxy(
            name,
            symbol,
            decimals,
            cap,
            maxVestingPerWallet,
            atmSettingsAddress,
            atmGovernanceProxyAddress
        );
        address tlrTokenProxyAddress = address(tlrTokenProxy);

        atms[atmGovernanceProxyAddress] = true;
        tlrTokens[atmGovernanceProxyAddress] = tlrTokenProxyAddress;
        atmsList.add(atmGovernanceProxyAddress);

        // Emit new ATM created event.
        emit ATMCreated(msg.sender, atmGovernanceProxyAddress, tlrTokenProxyAddress);
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
        @notice Returns the TLR token address of a given associated atm address.
        @param atmAddress ATM address to test
        @return Address of the associated TLR Token
     */
    function getTLRToken(address atmAddress) external view returns (address) {
        return tlrTokens[atmAddress];
    }

    /**
        @notice Gets the ATMs list.
        @return the list of ATMs.
     */
    function getATMs() external view returns (address[] memory) {
        return atmsList;
    }

    /**
        @notice It updates the current atm settings.
        @param newATMSettingsAddress The new settings address.
     */
    function setATMSettings(address newATMSettingsAddress) external onlyPauser() {
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
        @param atmSettingsAddress the ATM settings address.
     */
    function initialize(address atmSettingsAddress) external isNotInitialized() {
        require(atmSettingsAddress.isContract(), "ATM_SETTINGS_MUST_BE_A_CONTRACT");

        _initialize();

        atmSettings = IATMSettings(atmSettingsAddress);
    }
}
