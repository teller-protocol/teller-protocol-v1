pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./BaseProxy.sol";
import "./BaseEscrow.sol";


/**
    @notice It creates a new Escrow contract using the logic implementation defined in the Settings contract.

    @author develop@teller.finance
 */
contract EscrowProxy is BaseProxy, BaseEscrow {
    /**
        @param settingsAddress the Settings contract address.
        @param loansAddress the Loans contract address.
        @param aLoanID the loanID associated to this Escrow contract.
     */
    constructor(address settingsAddress, address loansAddress, uint256 aLoanID)
        public
        payable
    {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");
        require(loansAddress.isContract(), "LOANS_MUST_BE_A_CONTRACT");

        settings = SettingsInterface(settingsAddress);
        loans = LoansInterface(loansAddress);
        loanID = aLoanID;
    }

    /** Internal Functions **/

    /**
        @dev Returns the current implementation.
        @return Address of the current implementation
     */
    function _implementation() internal view returns (address) {
        return _getImplementation(address(settings));
    }

    /**
        @notice It is the logic of grabbing the current Escrow logic implementation from a Settings contract address.
        @return Address of current Escrow logic implementation
     */
    function _getImplementation(address settingsAddress) internal view returns (address) {
        return SettingsInterface(settingsAddress).getEscrowFactory().escrowLogic();
    }
}
