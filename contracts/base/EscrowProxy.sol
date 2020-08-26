pragma solidity 0.5.17;

// Contracts
import "./BaseProxy.sol";
import "./BaseEscrow.sol";


/**
    @notice It is a Proxy contract for Escrows that uses the logic implementation as defined in the global EscrowFactory contract.
    @notice It extends BaseEscrow to get access to the settings.

    @author develop@teller.finance
 */
contract EscrowProxy is BaseProxy, BaseEscrow {
    /**
        @notice Define the Settings contract for the proxy to get the current implementation logic from the global EscrowFactory.
        @param settingsAddress the Settings contract address.
     */
    constructor(address settingsAddress)
        public
        payable
    {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");

        settings = SettingsInterface(settingsAddress);
    }

    /** Internal Functions **/

    /**
        @dev Returns the current implementation.
        @return Address of the current implementation
     */
    function _implementation() internal view returns (address) {
        return settings.escrowFactory().escrowLogic();
    }
}
