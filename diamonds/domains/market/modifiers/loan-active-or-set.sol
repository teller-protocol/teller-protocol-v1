// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ext_active_or_set } from "../external/active-or-set.sol";

abstract contract mod_loan_active_or_set_v1 is ext_active_or_set {
    /**
     * @notice Checks whether the loan is active and has been set or not
     * @dev Throws a require error if the loan is not active or has not been set
     * @param loanID number of loan to check
     */
    modifier loanActiveOrSet(uint256 loanID) {
        require(isActiveOrSet(loanID), "LOAN_NOT_ACTIVE_OR_SET");
        _;
    }
}

abstract contract mod_loan_active_or_set is mod_loan_active_or_set_v1 {}
