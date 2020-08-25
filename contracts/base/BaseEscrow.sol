pragma solidity 0.5.17;

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

    /**
        @notice It is the current loans contract instance.
     */
    LoansInterface public loans;

    /**
        @notice This loan id refers the loan in the loans contract.
        @notice This loan was taken out by a borrower.
     */
    uint256 public loanID;
}