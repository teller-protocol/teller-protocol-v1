pragma solidity 0.5.17;

// Interfaces
import "../interfaces/SettingsInterface.sol";

/**
    @notice It is the base contract for the Escrow and it's upgradeable Proxy.

    @author develop@teller.finance
 */
contract BaseEscrow {
    using Address for address;

    /**
        @notice The platform settings.
     */
    SettingsInterface public settings;
}