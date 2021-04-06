// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../contexts/access-control/modifiers/entry.sol";
import "../modifiers/when-not-paused.sol";
import "../internal/exchange-rates.sol";
import "../internal/conversions.sol";
import "../internal/compound.sol";
import "../../protocol/modifiers/protocol-authorized.sol";
import "../internal/token.sol";
import "../modifiers/loan-active-or-set.sol";
import "../internal/is-liquidable.sol";

abstract contract ent_liquidate_Market_v1 is
    mod_loan_active_or_set_v1,
    mod_entry_AccessControl_v1,
    mod_whenNotPaused_Market_v1,
    int_exchangeRates_LendingPool_v1,
    int_conversions_LendingPool_v1,
    mod_protocolAuthorized_Protocol_v1,
    int_compound_LendingPool_v1,
    int_TokenTx_Market_v1,
    int_isLiquidable_v1
{
    /**
     * @notice Liquidate a loan if it is expired or under collateralized
     * @param loanID The ID of the loan to be liquidated
     */
    function liquidateLoan(uint256 loanID)
        external
        override
        entry
        whenNotPaused
        protocolAuthorized(msg.sender)
        loanActive(loanID)
    {
        require(_isLiquidable(loanID), "DOESNT_NEED_LIQUIDATION");

        int256 rewardInCollateral = getLiquidationReward(loanID);

        // the liquidator pays the amount still owed on the loan
        uint256 amountToLiquidate =
            loans[loanID].principalOwed.add(loans[loanID].interestOwed);
        lendingPool.repay(
            loans[loanID].principalOwed,
            loans[loanID].interestOwed,
            msg.sender
        );

        loans[loanID].status = TellerCommon.LoanStatus.Closed;
        loans[loanID].liquidated = true;

        // the caller gets the collateral from the loan
        _payOutLiquidator(loanID, rewardInCollateral, payable(msg.sender));

        emit LoanLiquidated(
            loanID,
            loans[loanID].loanTerms.borrower,
            msg.sender,
            rewardInCollateral,
            amountToLiquidate
        );
    }
}
