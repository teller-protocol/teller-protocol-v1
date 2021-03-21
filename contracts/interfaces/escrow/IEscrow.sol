pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "../../util/TellerCommon.sol";

// Interfaces
import "../loans/ILoanManager.sol";
import "../loans/ILoanManager.sol";

/**
 * @notice This interface defines all function to allow borrowers interact with their escrow contracts.
 *
 * @author develop@teller.finance
 */
interface IEscrow {
    /* State Variables */

    /**
     * @notice Holds the instance of the associated LoanManager contract for this Escrow loan.
     */
    function loanManager() external view returns (ILoanManager);

    /**
     * @notice Holds the address of the LendingPool used for this Escrow loan.
     */
    function lendingPool() external view returns (address);

    /**
     * @notice Holds the loan ID of the loan for this Escrow in the LoansManager contract.
     */
    function loanID() external view returns (uint256);

    /**
     * @notice Holds the token that this Escrow loan was taken out with.
     */
    function lendingToken() external view returns (address);

    /**
     * @notice Holds the borrower's address that owns this Escrow loan.
     */
    function borrower() external view returns (address);

    /* Public Functions */

    /**
     * @notice Returns this Escrow's loan struct.
     */
    function getLoan() external view returns (TellerCommon.Loan memory);

    /* External Functions */

    /**
     * @notice It calls a given dapp using a delegatecall function by a borrower owned the current loan id associated to this escrow contract.
     * @param dappData the current dapp data to be executed.
     */
    function callDapp(TellerCommon.DappData calldata dappData) external;

    /**
     * @notice Calculate the value of the loan by getting the value of all tokens the Escrow owns.
     * @return Escrow total value denoted in the lending token.
     */
    function calculateTotalValue() external view returns (uint256);

    /**
     * @notice Repay this Escrow's loan.
     * @dev If the Escrow's balance of the borrowed token is less than the amount to repay, transfer tokens from the sender's wallet.
     */
    function repay(uint256 amount) external;

    /**
     * @notice Sends the tokens owned by this escrow to the recipient.
     * @dev The loan must not be active.
     * @dev The recipient must either be the loan borrower AND the loan must be already liquidated.
     */
    function claimTokens() external;

    /**
     * @notice Send the equivilant of tokens owned by this escrow (in collateral value) to the recipient,
     * @dev The loan must not be active
     * @dev The loan must be liquidated
     * @dev The recipeient must be the loan manager contract
     * @param recipient address to send the tokens to
     * @param value The value of escrow held tokens, to be claimed based on collateral value
     */
    function claimTokensByCollateralValue(address recipient, uint256 value)
        external;

    /**
     * @notice It initializes this escrow instance for a given loans address and loan id.
     * @param settingsAddress The address of the settings contract.
     * @param lendingPoolAddress e
     * @param aLoanID the loan ID associated to this escrow instance.
     * @param lendingTokenAddress The token that the Escrow loan will be for.
     * @param borrowerAddress e
     */
    function initialize(
        address settingsAddress,
        address lendingPoolAddress,
        uint256 aLoanID,
        address lendingTokenAddress,
        address borrowerAddress
    ) external;

    /**
     * @notice Notifies when the Escrow's tokens have been claimed.
     * @param recipient address where the tokens where sent to.
     */
    event TokensClaimed(address recipient);
}
