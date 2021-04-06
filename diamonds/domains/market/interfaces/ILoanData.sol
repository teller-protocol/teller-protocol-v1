// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @notice This interface defines the functions to get and calculate information about loan data.
 *
 * @author develop@teller.finance
 */
interface ILoanData {
    /**
     * @notice Checks whether the status of a loan is Active or has Terms Set
     * @param loanID The loan ID for which to check the status
     * @return bool value indicating if the loan is active or has terms set
     */
    function isActiveOrSet(uint256 loanID) external view returns (bool);

    /**
     * @notice Returns the total owed amount remaining for a specified loan
     * @param loanID The ID of the loan to be queried
     * @return uint256 The total amount owed remaining
     */
    function getTotalOwed(uint256 loanID) external view returns (uint256);

    /**
     * @notice Returns the total amount owed for a specified loan.
     * @param loanID The loan ID to get the total amount owed.
     * @return uint256 The amount owed.
     */
    function getLoanAmount(uint256 loanID) external view returns (uint256);

    /**
     * @notice Checks whether the loan's collateral ratio is considered to be secured based on the settings collateral buffer value.
     * @param loanID The loan ID to check.
     * @return bool value of it being secured or not.
     */
    function isLoanSecured(uint256 loanID) external view returns (bool);

    /**
     * @notice Checks whether a loan is allowed to be deposited to an Externally Owned Account.
     * @param loanID The loan ID to check the collateral ratio for.
     * @return bool indicating whether the loan with specified parameters can be deposited to an EOA.
     */
    function canGoToEOA(uint256 loanID) external view returns (bool);

    /**
     * @notice Returns the amount of interest owed for a given loan and loan amount.
     * @param loanID The loan ID to get the owed interest.
     * @param amountBorrow The principal of the loan to take out.
     * @return uint256 The interest owed.
     */
    function getInterestOwedFor(uint256 loanID, uint256 amountBorrow)
        external
        view
        returns (uint256);

    /**
     * @notice Returns the interest ratio based on the loan interest rate for the loan duration.
     * @dev The interest rate on the loan terms is APY.
     * @param loanID The loan ID to get the interest rate for.
     */
    function getInterestRatio(uint256 loanID) external view returns (uint256);

    /**
     * @notice Returns the collateral needed for a loan, in the lending token, needed to take out the loan or for it be liquidated.
     * @param loanID The loan ID for which to get collateral information for
     * @return uint256 Collateral needed in lending token value
     */
    function getCollateralInLendingTokens(uint256 loanID)
        external
        view
        returns (uint256);

    /**
     * @notice Get information on the collateral needed for the loan.
     * @param loanID The loan ID to get collateral info for.
     * @return neededInLendingTokens int256 Collateral needed in Lending tokens.
     * @return neededInCollateralTokens int256 Collateral needed in Collateral tokens (wei)
     * @return escrowLoanValue uint256 The value of the loan held in the escrow contract
     */
    function getCollateralNeededInfo(uint256 loanID)
        external
        view
        returns (
            int256 neededInLendingTokens,
            int256 neededInCollateralTokens,
            uint256 escrowLoanValue
        );

    /**
     * @notice Returns the minimum collateral value threshold, in the lending token, needed to take out the loan or for it be liquidated.
     * @dev If the loan status is TermsSet, then the value is whats needed to take out the loan.
     * @dev If the loan status is Active, then the value is the threshold at which the loan can be liquidated at.
     * @param loanID The loan ID to get needed collateral info for.
     * @return neededInLendingTokens int256 The minimum collateral value threshold required.
     * @return escrowLoanValue uint256 The value of the loan held in the escrow contract.
     */
    function getCollateralNeededInTokens(uint256 loanID)
        external
        view
        returns (int256 neededInLendingTokens, uint256 escrowLoanValue);

    /**
     * @notice It checks if a loan can be liquidated.
     * @param loanID The loan ID to check.
     * @return true if the loan is liquidable.
     */
    function isLiquidable(uint256 loanID) external view returns (bool);

    /**
     * @notice It gets the current liquidation reward for a given loan.
     * @param loanID The loan ID to get the info.
     * @return The value the liquidator will receive denoted in collateral tokens.
     */
    function getLiquidationReward(uint256 loanID)
        external
        view
        returns (int256);
}
