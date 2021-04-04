// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./get-loans-storage.sol";
import "../../protocol/interfaces/IPlatformSettings.sol";
import "../../../libraries/TellerCommon.sol";
import "../storage/loans.sol";
import "../../protocol/address.sol";

abstract contract int_create_loan_v1 is sto_Loans {
    using NumbersLib for uint256;

    function _createNewLoan(
        TellerCommon.LoanRequest memory request,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    ) internal returns (uint256) {
        uint256 loanID = getLoansStorage().loanIDCounter;
        getLoansStorage().loanIDCounter += 1;

        getLoansStorage().loans[loanID].id = loanID;
        getLoansStorage().loans[loanID].status = TellerCommon
            .LoanStatus
            .TermsSet;
        getLoansStorage().loans[loanID].loanTerms = TellerCommon.LoanTerms({
            borrower: request.borrower,
            recipient: request.recipient,
            interestRate: interestRate,
            collateralRatio: collateralRatio,
            maxLoanAmount: maxLoanAmount,
            duration: request.duration
        });

        uint256 termsExpiryTime =
            IPlatformSettings(PROTOCOL).getTermsExpiryTimeValue();

        getLoansStorage().loans[loanID].termsExpiry =
            block.timestamp +
            (termsExpiryTime);

        return loanID;
    }
}

abstract contract int_create_loan is int_create_loan_v1 {}
