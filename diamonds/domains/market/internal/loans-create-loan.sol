// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_Loans } from "./get-loans-storage.sol";
import { dat_Loans } from "../data/loans.sol";
import "../../protocol/interfaces/IPlatformSettings.sol";

abstract contract int_create_loan_v1 is int_get_sto_Loans_v1, dat_Loans {
    function _createNewLoan(
        TellerCommon.LoanRequest memory request,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    ) internal returns (uint256) {
        uint256 loanID = s().loanIDCounter;
        s().loanIDCounter = s().loanIDCounter.add(1);

        require(
            s().loans[loanID].status == TellerCommon.LoanStatus.NonExistent,
            "LOAN_ALREADY_EXISTS"
        );
        require(request.borrower != address(0), "BORROWER_EMPTY");

        s().loans[loanID].id = loanID;
        s().loans[loanID].status = TellerCommon.LoanStatus.TermsSet;
        s().loans[loanID].loanTerms = TellerCommon.LoanTerms({
            borrower: request.borrower,
            recipient: request.recipient,
            interestRate: interestRate,
            collateralRatio: collateralRatio,
            maxLoanAmount: maxLoanAmount,
            duration: request.duration
        });

        uint256 termsExpiryTime =
            IPlatformSettings(PROTOCOL).getTermsExpiryTimeValue();
        s().loans[loanID].termsExpiry = block.timestamp.add(termsExpiryTime);

        return loanID;
    }
}

abstract contract int_create_loan is int_create_loan_v1 {}
