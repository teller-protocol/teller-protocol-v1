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
        @notice Calculate this Escrow instance total value.
        @return This Escrow instance total value expressed in ETH and Token value.
     */
    function calculateTotalValue()
        external
        view
        returns (TellerCommon.EscrowValue memory);

    /**
        @notice Checks if this Escrow loan value is undervalued based its token price.
        @return true if this escrow loan is undervalued based on its token price.
     */
    function isUnderValued() external view returns (bool);

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
        @notice Send the equivilant of tokens owned by this escrow (in collateral value) to the recipient,
        @dev The loan must not be active
        @dev The loan must be liquidated
        @dev The recipeient must be the loans contract
        @param recipient address to send the tokens to
        @param value The value of escrow held tokens, to be claimed based on collateral value
      */
    function claimTokensByCollateralValue(address recipient, uint256 value) external;

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
