pragma solidity 0.5.17;


/**
    @notice This interface defines the functions to create the ATM instances.
    @author develop@teller.finance
 */
interface ATMGovernanceFactoryInterface {
    /** Events */

    /**
        @notice This event is emitted when a new ATM instance is created.
        @param atmAddress new ATM instance address.
        @param creator creator address.
        @param supplyToDebt initial supply to debt ratio value.
     */
    event ATMGovernanceCreated(
        address indexed atmAddress,
        address indexed creator,
        uint256 supplyToDebt
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
        @notice Tests whether an address is an ATM instance or not.
        @param atmAddress address to test.
        @return true if the given address is an ATM. Otherwise it returns false.
     */
    function isATM(address atmAddress) external view returns (bool);
}
