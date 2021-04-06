pragma solidity ^0.8.0;

import "../../../libraries/TellerCommon.sol";
import "../storage/loans.sol";

abstract contract ext_status_Loans_v1 is sto_Loans {
    function getStatus(uint256 loanID)
        external
        view
        returns (TellerCommon.LoanStatus)
    {
        return getLoansStorage().loans[loanID].status;
    }
}
