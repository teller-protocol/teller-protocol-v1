import "../storage/loans.sol";
import "../../../libraries/TellerCommon.sol";

abstract contract int_isActiveOrSet_v1 is sto_Loans {
    function _isActiveOrSet(uint256 loanID) internal view returns (bool) {
        TellerCommon.LoanStatus status = getLoansStorage().loans[loanID].status;
        return
            status == TellerCommon.LoanStatus.Active ||
            status == TellerCommon.LoanStatus.TermsSet;
    }
}
