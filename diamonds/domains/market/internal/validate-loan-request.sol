// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_Loans } from "./get-loans-storage.sol";
import { dat_Loans } from "../data/loans.sol";
import "../../protocol/interfaces/IPlatformSettings.sol";

abstract contract int_validate_loan_request_v1 is int_get_sto_Loans, dat_Loans {
    function _validateLoanRequest(address borrower, uint256 nonce)
        internal
        view
    {
        uint256[] storage _borrowerLoans = s().borrowerLoans[borrower];
        uint256 numberOfLoans = _borrowerLoans.length;

        require(nonce == numberOfLoans, "BAD_NONCE");

        if (numberOfLoans == 0) {
            return;
        }

        require(
            s().loans[_borrowerLoans[numberOfLoans - 1]].loanStartTime +
                IPlatformSettings(PROTOCOL)
                    .getRequestLoanTermsRateLimitValue() <=
                block.timestamp,
            "REQS_LOAN_TERMS_LMT_EXCEEDS_MAX"
        );
    }
}

abstract contract int_validate_loan_request is int_validate_loan_request_v1 {}
