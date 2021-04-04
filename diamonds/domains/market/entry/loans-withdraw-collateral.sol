// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    mod_protocolAuthorized_Protocol_v1
} from "../../protocol/modifiers/protocol-authorized.sol";
import {
    mod_whenNotPaused_Market_v1
} from "../modifiers/when-nothing-paused.sol";
import { int_withdraw_collateral } from "../internal/withdraw-collateral.sol";
import {
    ext_get_collateral_needed_info
} from "../external/get-collateral-needed-info.sol";

abstract contract ent_Loans_withdraw_collateral_v1 is
    mod_protocolAuthorized_Protocol_v1,
    mod_whenNotPaused_Market_v1,
    ext_get_collateral_needed_info,
    int_withdraw_collateral
{
    function withdrawCollateral(uint256 amount, uint256 loanID)
        external
        override
        loanActiveOrSet(loanID)
        whenNothingPaused
        protocolAuthorized(msg.sender)
    {
        require(
            msg.sender == s().loans[loanID].loanTerms.borrower,
            "CALLER_DOESNT_OWN_LOAN"
        );
        require(amount > 0, "CANNOT_WITHDRAW_ZERO");

        if (s().loans[loanID].status == TellerCommon.LoanStatus.Active) {
            (, int256 neededInCollateralTokens, ) =
                getCollateralNeededInfo(loanID);
            if (neededInCollateralTokens > 0) {
                uint256 withdrawalAmount =
                    s().loans[loanID].collateral.sub(
                        uint256(neededInCollateralTokens)
                    );
                require(
                    withdrawalAmount >= amount,
                    "COLLATERAL_AMOUNT_TOO_HIGH"
                );
            }
        } else {
            require(
                s().loans[loanID].collateral >= amount,
                "COLLATERAL_AMOUNT_NOT_MATCH"
            );
        }

        _withdrawCollateral(loanID, amount, payable(msg.sender));
    }
}

abstract contract ent_withdraw_collateral is ent_Loans_withdraw_collateral_v1 {}
