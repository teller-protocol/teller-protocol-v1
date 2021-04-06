// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_Loans } from "./get-loans-storage.sol";

abstract contract int_pay_out_collateral_v1 is int_get_sto_Loans {
    function _payOutCollateral(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal {
        s().totalCollateral = s().totalCollateral.sub(amount);
        s().loans[loanID].collateral = s().loans[loanID].collateral.sub(amount);
        recipient.transfer(amount);
    }
}

abstract contract int_pay_out_collateral is int_pay_out_collateral_v1 {}
