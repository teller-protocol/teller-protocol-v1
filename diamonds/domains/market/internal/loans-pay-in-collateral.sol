// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_Loans } from "./get-loans-storage.sol";

abstract contract int_pay_in_collateral_v1 is int_get_sto_Loans {
    function _payInCollateral(uint256 loanID, uint256 amount) internal {
        require(msg.value == amount, "INCORRECT_ETH_AMOUNT");

        s().totalCollateral = s().totalCollateral.add(amount);
        s().loans[loanID].collateral = s().loans[loanID].collateral.add(amount);
        s().loans[loanID].lastCollateralIn = block.timestamp;
        emit CollateralDeposited(loanID, msg.sender, amount);
    }
}

abstract contract int_pay_in_collateral is int_pay_in_collateral_v1 {}
