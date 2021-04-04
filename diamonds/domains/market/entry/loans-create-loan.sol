// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { dat_Loans } from "../data/loans.sol";
import { int_create_loan } from "../internal/loans-create-loan.sol";
import { ext_can_go_to_eoa } from "../external/loans-can-eoa.sol";

abstract contract ent_Loans_create_loan_v1 is
    dat_Loans,
    //    ext_process_terms,
    int_create_loan,
    //    int_pay_in_collateral,
    ext_can_go_to_eoa,
    sto_Loans_v1
{
    function createLoanWithTerms(
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse[] calldata responses,
        uint256 collateralAmount
    )
        external
        payable
        override
        whenNotPaused
        withValidLoanRequest(request)
        onlyAuthorized
    {
        require(msg.sender == request.borrower, "NOT_LOAN_REQUESTER");

        (uint256 interestRate, uint256 collateralRatio, uint256 maxLoanAmount) =
            processLoanTerms(request, responses);

        uint256 loanID =
            _createNewLoan(
                request,
                interestRate,
                collateralRatio,
                maxLoanAmount
            );

        if (collateralAmount > 0) {
            _payInCollateral(loanID, collateralAmount);
        }

        if (request.recipient.isNotEmpty()) {
            require(canGoToEOA(loanID), "UNDER_COLL_WITH_RECIPIENT");
        }

        s().borrowerLoans[request.borrower].push(loanID);

        emit LoanTermsSet(
            loanID,
            msg.sender,
            s().loans[loanID].loanTerms.recipient,
            request.requestNonce
        );
    }
}

abstract contract ent_Loans_create_loan is ent_Loans_create_loan_v1 {}
