// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    mod_protocolAuthorized_Protocol_v1
} from "../../protocol/modifiers/protocol-authorized.sol";
import {
    mod_whenNotPaused_Market_v1
} from "../modifiers/when-nothing-paused.sol";
import { mod_loan_active_or_set } from "../modifiers/loan-active-or-set.sol";
import {
    ext_get_collateral_needed_info
} from "../external/get-collateral-needed-info.sol";
import { ext_can_go_to_eoa } from "../external/loans-can-eoa.sol";
import {
    ext_get_interest_owed_for
} from "../external/get-interest-owed-for.sol";
import { int_create_escrow } from "../internal/loans-create-escrow.sol";

abstract contract ent_Loans_take_out_loan_v1 is
    mod_protocolAuthorized_Protocol_v1,
    mod_whenNotPaused_Market_v1,
    mod_loan_active_or_set,
    ext_can_go_to_eoa,
    ext_get_collateral_needed_info,
    ext_get_interest_owed_for,
    int_create_escrow
{
    /**
     * @notice Take out a loan
     *
     * @dev collateral ratio is a percentage of the loan amount that's required in collateral
     * @dev the percentage will be *(10**2). I.e. collateralRatio of 5244 means 52.44% collateral
     * @dev is required in the loan. Interest rate is also a percentage with 2 decimal points.
     */
    function takeOutLoan(uint256 loanID, uint256 amountBorrow)
        external
        override
        whenNothingPaused
        protocolAuthorized(msg.sender)
    {
        require(
            msg.sender == s().loans[loanID].loanTerms.borrower,
            "NOT_BORROWER"
        );
        require(
            s().loans[loanID].status == TellerCommon.LoanStatus.TermsSet,
            "LOAN_NOT_SET"
        );
        require(
            s().loans[loanID].termsExpiry >= block.timestamp,
            "LOAN_TERMS_EXPIRED"
        );
        require(_isDebtRatioValid(amountBorrow), "SUPPLY_TO_DEBT_EXCEEDS_MAX");
        require(
            s().loans[loanID].loanTerms.maxLoanAmount >= amountBorrow,
            "MAX_LOAN_EXCEEDED"
        );
        // check that enough collateral has been provided for this loan
        (, int256 neededInCollateral, ) = getCollateralNeededInfo(loanID);
        require(
            neededInCollateral <= int256(s().loans[loanID].collateral),
            "MORE_COLLATERAL_REQUIRED"
        );
        require(
            s().loans[loanID].lastCollateralIn <=
                block.timestamp.sub(
                    IPlatformSettings(PROTOCOL).getSafetyIntervalValue()
                ),
            "COLLATERAL_DEPOSITED_RECENTLY"
        );

        s().loans[loanID].borrowedAmount = amountBorrow;
        s().loans[loanID].principalOwed = amountBorrow;
        s().loans[loanID].interestOwed = getInterestOwedFor(
            loanID,
            amountBorrow
        );
        s().loans[loanID].status = TellerCommon.LoanStatus.Active;
        s().loans[loanID].loanStartTime = block.timestamp;

        address loanRecipient;
        bool eoaAllowed = canGoToEOA(loanID);
        if (eoaAllowed) {
            loanRecipient = s().loans[loanID].loanTerms.recipient.isEmpty()
                ? s().loans[loanID].loanTerms.borrower
                : s().loans[loanID].loanTerms.recipient;
        } else {
            s().loans[loanID].escrow = _createEscrow(loanID);
            s().loanRecipient = s().loans[loanID].escrow;
        }

        ILendingPool(PROTOCOL).createLoan(amountBorrow, loanRecipient);

        if (!eoaAllowed) {
            s().loans[loanID].escrow.requireNotEmpty(
                "ESCROW_CONTRACT_NOT_DEFINED"
            );
            IEscrow(loans[loanID].escrow).initialize(
                address(IPlatformSettings(PROTOCOL)),
                address(ILendingPool(PROTOCOL)),
                loanID,
                s().lendingToken,
                s().loans[loanID].loanTerms.borrower
            );
        }

        emit LoanTakenOut(
            loanID,
            s().loans[loanID].loanTerms.borrower,
            s().loans[loanID].escrow,
            amountBorrow
        );
    }
}
