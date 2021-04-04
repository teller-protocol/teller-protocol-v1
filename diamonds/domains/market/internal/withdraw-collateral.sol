// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_pay_out_collateral } from "./pay-out-collateral.sol";

abstract contract int_withdraw_collateral_v1 is int_pay_out_collateral {
    function _withdrawCollateral(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal {
        _payOutCollateral(loanID, amount, recipient);

        emit CollateralWithdrawn(
            loanID,
            s().loans[loanID].loanTerms.borrower,
            recipient,
            amount
        );
    }
}

abstract contract int_withdraw_collateral is int_withdraw_collateral_v1 {}
