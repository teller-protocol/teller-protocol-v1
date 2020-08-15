pragma solidity 0.5.17;


/**
    @notice This interface defines the functions to create the ATM instances.
    @author develop@teller.finance
 */
interface IATMFactory {
    /** Events */

    /**
        @notice This event is emitted when a new ATM instance is created.
        @param creator creator address.
        @param atmGovernanceAddress new ATM Governance instance address.
        @param atmTokenAddress new ATM Token instance address.
     */
    event ATMCreated(
        address indexed creator,
        address indexed atmGovernanceAddress,
        address indexed atmTokenAddress
    );

    /**
        @notice This event is emitted when the setting is updated.
        @param sender address that sent the transaction.
        @param oldSettings the old settings address.
        @param newSettings the new settings address.
     */
    event SettingsUpdated(
        address indexed sender,
        address oldSettings,
        address newSettings
    );

    /* State Variables */

    /** Modifiers */

    /* Constructor */

    /** External Functions */

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
    ) external returns (address);

    /**
        @notice It updates the current settings.
        @param newSettingsAddress the new setting address.
     */
    function setSettings(address newSettingsAddress) external;

    /**
        @notice Tests whether an address is an ATM instance or not.
        @param atmAddress address to test.
        @return true if the given address is an ATM. Otherwise it returns false.
     */
    function isATM(address atmAddress) external view returns (bool);

    /**
        @notice Gets the ATMs list.
        @return the list of ATMs.
     */
    function getATMs() external view returns (address[] memory);
}
