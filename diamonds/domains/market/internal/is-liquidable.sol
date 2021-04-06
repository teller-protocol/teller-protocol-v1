import "../../../libraries/TellerCommon.sol";
import "../storage/loans.sol";
import "../internal/get-collateral-needed-info.sol";

abstract contract int_isLiquidable_V1 is
    sto_Loans,
    int_getCollateralNeededInfo
{
    /**
     * @notice It checks if a loan can be liquidated.
     * @param loanID The loan ID to check.
     * @return true if the loan is liquidable.
     */
    function isLiquidable(uint256 loanID) internal view returns (bool) {
        // Check if loan can be liquidated
        if (
            getLoansStorage().loans[loanID].status !=
            TellerCommon.LoanStatus.Active
        ) {
            return false;
        }

        if (getLoansStorage().loans[loanID].loanTerms.collateralRatio > 0) {
            // If loan has a collateral ratio, check how much is needed
            (, int256 neededInCollateral, ) = _getCollateralNeededInfo(loanID);
            return
                neededInCollateral >
                int256(getLoansStorage().loans[loanID].collateral);
        } else {
            // Otherwise, check if the loan has expired
            return
                block.timestamp >=
                getLoansStorage().loans[loanID].loanStartTime.add(
                    getLoansStorage().loans[loanID].loanTerms.duration
                );
        }
    }
}
