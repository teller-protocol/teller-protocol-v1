// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { mod_with_valid_request } from "../modifiers/with-valid-request.sol";
import {
    mod_protocolAuthorized_Protocol_v1
} from "../../protocol/modifiers/protocol-authorized.sol";
import { int_create_loan } from "../internal/loans-create-loan.sol";
import { int_pay_in_collateral } from "../internal/loans-pay-in-collateral.sol";
import "../internal/process-loan-terms.sol";
import "../modifiers/when-not-paused.sol";
import "../internal/can-go-to-eoa.sol";

abstract contract ent_Loans_create_loan_v1 is
    mod_protocolAuthorized_Protocol_v1,
    mod_whenNotPaused_Market_v1,
    mod_with_valid_request,
    int_create_loan,
    int_processLoanTerms_Market_v1,
    int_pay_in_collateral,
    int_canGoToEoa_v1
{
    function createLoanWithTerms(
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse[] calldata responses,
        uint256 collateralAmount
    )
        external
        payable
        whenNotPaused
        withValidLoanRequest(request)
        protocolAuthorized(msg.sender)
    {
        require(msg.sender == request.borrower, "NOT_LOAN_REQUESTER");

        (uint256 interestRate, uint256 collateralRatio, uint256 maxLoanAmount) =
            _processLoanTerms(request, responses);

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
            require(_canGoToEOA(loanID), "UNDER_COLL_WITH_RECIPIENT");
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
