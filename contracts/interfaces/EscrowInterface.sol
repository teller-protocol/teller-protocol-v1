pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/TellerCommon.sol";

/**
    @notice This interface defines all function to allow borrowers interact with their escrow contracts.
    
    @author develop@teller.finance
 */
interface EscrowInterface {
    /**
        @notice It calls a given dapp using a delegatecall function by a borrower owned the current loan id associated to this escrow contract.
        @param dappData the current dapp data to be executed.
     */
    function callDapp(TellerCommon.DappData calldata dappData) external;

    /**
        @notice Gets the borrower for this Escrow's loan.
        @return address of this Escrow's loans
     */
    function getBorrower() external view returns (address);

    /**
        @notice Calculate the value of the loan by getting the value of all tokens the Escrow owns.
        @return Escrow total value denoted in the lending token.
     */
    function calculateLoanValue() external view returns (uint256);

    /**
        @notice Repay this Escrow's loan.
        @dev If the Escrow's balance of the borrowed token is less than the amount to repay, transfer tokens from the sender's wallet.
     */
    function repay(uint256 amount) external;

    /**
        @notice Sends the tokens owned by this escrow to the recipient.
        @dev The loan must not be active.
        @dev The recipient must either be the loan borrower OR the loan must be already liquidated.
        @param recipient address to send the tokens to.
    */
    function claimTokens(address recipient) external;

    /**
        @notice It initializes this escrow instance for a given loans address and loan id.
        @param loansAddress loans contract address.
        @param aLoanID the loan ID associated to this escrow instance.
     */
    function initialize(address loansAddress, uint256 aLoanID) external;

    /**
        @notice Notifies when the Escrow's tokens have been claimed.
        @param recipient address where the tokens where sent to.
    */
    event TokensClaimed(address recipient);
}
