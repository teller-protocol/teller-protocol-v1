pragma solidity 0.5.17;

// Interfaces
import "../interfaces/SettingsInterface.sol";

/**
TODO change it
    @notice It is the base contract for the Escrow and it's upgradeable Proxy.

    @author develop@teller.finance
 */
contract BaseDynamic {
    using Address for address;

    /**
        @notice The logic versions registry.
     */
    SettingsInterface public settings;
    // TODO Verify OpenZeppeling impl. It mustn't change over the time.
    bytes32 internal logicName;
}

