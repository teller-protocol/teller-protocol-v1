// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_Loans } from "./get-loans-storage.sol";

abstract contract int_pay_in_collateral_v1 is int_get_sto_Loans {
    /**
     * @notice This event is emitted when collateral has been deposited for the loan
     * @param loanID ID of the loan for which collateral was deposited
     * @param borrower Account address of the borrower
     * @param depositAmount Amount of collateral deposited
     */
    event CollateralDeposited(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 depositAmount
    );

    function _payInCollateral(uint256 loanID, uint256 amount) internal {
        require(msg.value == amount, "INCORRECT_ETH_AMOUNT");

        s().totalCollateral += amount;
        s().loans[loanID].collateral += amount;
        s().loans[loanID].lastCollateralIn = block.timestamp;
        emit CollateralDeposited(loanID, msg.sender, amount);
    }
}

abstract contract int_pay_in_collateral is int_pay_in_collateral_v1 {}
