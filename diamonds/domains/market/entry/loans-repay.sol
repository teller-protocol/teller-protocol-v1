// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    mod_protocolAuthorized_Protocol_v1
} from "../../protocol/modifiers/protocol-authorized.sol";
import { mod_whenNotPaused_Market_v1 } from "../modifiers/when-not-paused.sol";
import {
    int_tokenTransferFrom_Market_v1
} from "../internal/token-transfer-from.sol";
import { mod_loan_active_or_set } from "../modifiers/loan-active-or-set.sol";
import { int_withdraw_collateral } from "../internal/withdraw-collateral.sol";
import {
    mod_entry_AccessControl_v1
} from "../../../contexts/access-control/modifiers/entry.sol";
import "../external/get-total-owed.sol";

abstract contract ent_Loans_repay_v1 is
    mod_protocolAuthorized_Protocol_v1,
    mod_whenNotPaused_Market_v1,
    mod_loan_active_or_set,
    mod_entry_AccessControl_v1,
    ext_get_total_owed,
    int_withdraw_collateral,
    int_tokenTransferFrom_Market_v1
{
    /**
     * @notice Make a payment to a loan
     * @param amount The amount of tokens to pay back to the loan
     * @param loanID The ID of the loan the payment is for
     */
    function repay(uint256 amount, uint256 loanID)
        external
        override
        whenNothingPaused
        protocolAuthorized(msg.sender)
        entry
    {
        require(amount > 0, "AMOUNT_VALUE_REQUIRED");
        // calculate the actual amount to repay
        uint256 totalOwed = getTotalOwed(loanID);
        if (totalOwed < amount) {
            amount = totalOwed;
        }
        // update the amount owed on the loan
        totalOwed = totalOwed.sub(amount);

        // Deduct the interest and principal owed
        uint256 principalPaid;
        uint256 interestPaid;
        if (amount < s().loans[loanID].interestOwed) {
            interestPaid = amount;
            s().loans[loanID].interestOwed = s().loans[loanID].interestOwed.sub(
                amount
            );
        } else {
            if (s().loans[loanID].interestOwed > 0) {
                interestPaid = s().loans[loanID].interestOwed;
                amount = amount.sub(interestPaid);
                s().loans[loanID].interestOwed = 0;
            }

            if (amount > 0) {
                principalPaid = amount;
                s().loans[loanID].principalOwed = s().loans[loanID]
                    .principalOwed
                    .sub(amount);
            }
        }

        uint256 totalAmount = principalAmount.add(interestAmount);
        require(totalAmount > 0, "REPAY_ZERO");

        // Transfers tokens to LendingPool.
        tokenTransferFrom(msg.sender, totalAmount);

        _totalRepaid = _totalRepaid.add(principalAmount);
        totalInterestEarned = totalInterestEarned.add(interestAmount);

        // if the loan is now fully paid, close it and return collateral
        if (totalOwed == 0) {
            s().loans[loanID].status = TellerCommon.LoanStatus.Closed;
            _withdrawCollateral(
                loanID,
                s().loans[loanID].collateral,
                s().loans[loanID].loanTerms.borrower
            );
        }

        emit LoanRepaid(
            loanID,
            s().loans[loanID].loanTerms.borrower,
            principalPaid.add(interestPaid),
            msg.sender,
            totalOwed
        );
    }
}

abstract contract ent_Loans_repay is ent_Loans_repay_v1 {}
