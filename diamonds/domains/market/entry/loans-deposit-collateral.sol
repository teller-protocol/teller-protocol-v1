// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    mod_protocolAuthorized_Protocol_v1
} from "../../protocol/modifiers/protocol-authorized.sol";
import { mod_whenNotPaused_Market_v1 } from "../modifiers/when-not-paused.sol";
import { mod_loan_active_or_set } from "../modifiers/loan-active-or-set.sol";
import { int_pay_in_collateral } from "../internal/loans-pay-in-collateral.sol";

abstract contract ent_Loans_deposit_collateral_v1 is
    mod_protocolAuthorized_Protocol_v1,
    mod_whenNotPaused_Market_v1,
    mod_loan_active_or_set,
    int_pay_in_collateral
{
    /**
     * @notice Deposit collateral tokens into a loan.
     * @param borrower The address of the loan borrower.
     * @param loanID The ID of the loan the collateral is for
     * @param amount The amount to deposit as collateral.
     */
    function depositCollateral(
        address borrower,
        uint256 loanID,
        uint256 amount
    )
        external
        payable
        override
        loanActiveOrSet(loanID)
        whenNotPaused
        protocolAuthorized(msg.sender)
    {
        borrower.requireEqualTo(
            s().loans[loanID].loanTerms.borrower,
            "BORROWER_LOAN_ID_MISMATCH"
        );
        require(amount > 0, "CANNOT_DEPOSIT_ZERO");

        // Update the loan collateral and total. Transfer tokens to this contract.
        _payInCollateral(loanID, amount);
    }
}

abstract contract ent_deposit_collateral is ent_Loans_deposit_collateral_v1 {}
