// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./get-interest-owed-for.sol";

abstract contract ext_get_total_owed_v1 is ext_get_interest_owed_for {
    /**
     * @notice Returns the total amount owed for a specified loan.
     * @param loanID The loan ID to get the total amount owed.
     * @return uint256 The total owed amount.
     */
    function getTotalOwed(uint256 loanID)
        public
        view
        override
        returns (uint256)
    {
        if (s().loans[loanID].status == TellerCommon.LoanStatus.TermsSet) {
            uint256 interestOwed =
                getInterestOwedFor(
                    loanID,
                    s().loans[loanID].loanTerms.maxLoanAmount
                );
            return s().loans[loanID].loanTerms.maxLoanAmount.add(interestOwed);
        } else if (s().loans[loanID].status == TellerCommon.LoanStatus.Active) {
            return
                s().loans[loanID].principalOwed.add(
                    s().loans[loanID].interestOwed
                );
        }
        return 0;
    }
}

abstract contract ext_get_total_owed is ext_get_total_owed_v1 {}
