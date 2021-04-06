// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_Loans } from "../internal/get-loans-storage.sol";
import { dat_Loans } from "../data/loans.sol";

abstract contract ext_get_interest_ratio_v1 is dat_Loans, int_get_sto_Loans {
    /**
     * @notice Returns the interest ratio based on the loan interest rate for the loan duration.
     * @dev The interest rate on the loan terms is APY.
     * @param loanID The loan ID to get the interest rate for.
     */
    function getInterestRatio(uint256 loanID) external view returns (uint256) {
        return
            s().loans[loanID]
                .loanTerms
                .interestRate
                .mul(s().loans[loanID].loanTerms.duration)
                .div(SECONDS_PER_YEAR);
    }
}

abstract contract ext_get_interest_ratio is ext_get_interest_ratio_v1 {}
