// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_Loans } from "../internal/get-loans-storage.sol";

abstract contract ext_get_loan_amount_v1 is int_get_sto_Loans {
    /**
     * @notice Returns the total amount owed for a specified loan.
     * @param loanID The loan ID to get the total amount owed.
     * @return uint256 The amount owed.
     */
    function getLoanAmount(uint256 loanID)
        public
        view
        override
        returns (uint256)
    {
        if (s().loans[loanID].status == TellerCommon.LoanStatus.TermsSet) {
            return s().loans[loanID].loanTerms.maxLoanAmount;
        } else if (s().loans[loanID].status == TellerCommon.LoanStatus.Active) {
            return s().loans[loanID].borrowedAmount;
        }
        return 0;
    }
}

abstract contract ext_get_loan_amount is ext_get_loan_amount_v1 {}
