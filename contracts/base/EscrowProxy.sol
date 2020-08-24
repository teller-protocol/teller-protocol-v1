pragma solidity 0.5.17;

// Contracts
import "./BaseProxy.sol";
import "./BaseEscrow.sol";


/**
    @notice It is a Proxy contract for Escrows that uses the logic implementation as defined in the EscrowFactory contract.
    @notice It extends BaseEscrow so the constructor is able to store the Escrow's initial state variables.

    @author develop@teller.finance
 */
contract EscrowProxy is BaseProxy, BaseEscrow {
    /**
        @notice This Proxy constructor acts as the constructor/initialize function for the Escrow contract.
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
        return settings.getEscrowFactory().escrowLogic();
    }
}
