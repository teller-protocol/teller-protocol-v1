// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { MarketStorageLib, LoanStatus } from "../storage/market.sol";

abstract contract LoansMods {
    /**
     * @notice Checks whether the loan is active or not
     * @dev Throws a require error if the loan is not active
     * @param loanID number of loan to check
     */
    modifier loanActive(uint256 loanID) {
        require(
            MarketStorageLib.marketStore().loans[loanID].status ==
                LoanStatus.Active,
            "LOAN_NOT_ACTIVE"
        );
        _;
    }
    /**
     * @notice Checks whether the loan is active and has been set or not
     * @dev Throws a require error if the loan is not active or has not been set
     * @param loanID number of loan to check
     */
    modifier loanActiveOrSet(uint256 loanID) {
        require(
            MarketStorageLib.marketStore().loans[loanID].status ==
                LoanStatus.Active ||
                MarketStorageLib.marketStore().loans[loanID].status ==
                LoanStatus.TermsSet,
            "LOAN_NOT_ACTIVE_OR_SET"
        );
        _;
    }
}
