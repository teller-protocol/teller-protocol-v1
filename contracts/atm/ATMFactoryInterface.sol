pragma solidity 0.5.17;

/**
    @notice This interface defines the functions to create the ATM instances.
    @author develop@teller.finance
 */
interface ATMFactoryInterface {
    /** Events */

    /**
        @notice This event is emitted when a new ATM instance is created.
        @param creator creator address.
        @param atmGovernanceAddress new ATM Governance instance address.
        @param tlrTokenAddress new TLR Token instance address.
     */
    event ATMCreated(
        address indexed creator,
        address indexed atmGovernanceAddress,
        address indexed tlrTokenAddress
    );

    /**
        @notice This event is emitted when the ATM setting is updated.
        @param sender address that sent the transaction.
        @param oldATMSettings the old ATM settings address.
        @param newATMSettings the new ATM settings address.
     */
    event ATMSettingsUpdated(
        address indexed sender,
        address oldATMSettings,
        address newATMSettings
    );

    /* State Variables */

    /** Modifiers */

    /* Constructor */

    /** External Functions */

    /**
        @notice It creates a new ATM instance.
        @param name TLR token name.
        @param symbol TLR token symbol
        @param decimals TLR token decimals 
        @param cap TLR token max cap.
        @param maxVestingPerWallet max vesting per wallet for the TLR token.
        @return the new ATM governance instance address.
     */
    function createATM(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 cap,
        uint256 maxVestingPerWallet
    ) external returns (address);

    /**
        @notice It updates the current atm settings.
        @param newATMSettingsAddress The new settings address.
     */
    function setATMSettings(address newATMSettingsAddress) external;

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

    /**
        @notice Returns the TLR token address of a given associated atm address.
        @param atmAddress ATM address to test
        @return Address of the associated TLR Token
     */
    function getTLRToken(address atmAddress) external view returns (address);
}
