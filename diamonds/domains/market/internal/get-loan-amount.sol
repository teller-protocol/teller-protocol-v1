import "../../../libraries/TellerCommon.sol";
import "../storage/loans.sol";

abstract contract int_getLoanAmount_v1 is sto_Loans {
    function _getLoanAmount(uint256 loanID) internal view returns (uint256) {
        if (
            getLoansStorage().loans[loanID].status ==
            TellerCommon.LoanStatus.TermsSet
        ) {
            return getLoansStorage().loans[loanID].loanTerms.maxLoanAmount;
        } else if (
            getLoansStorage().loans[loanID].status ==
            TellerCommon.LoanStatus.Active
        ) {
            return getLoansStorage().loans[loanID].borrowedAmount;
        }
        return 0;
    }
}
