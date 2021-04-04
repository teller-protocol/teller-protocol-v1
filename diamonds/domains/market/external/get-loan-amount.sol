// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_Loans } from "../internal/get-loans-storage.sol";
import "../internal/get-loan-amount.sol";

abstract contract ext_getLoanAmount_v1 is int_getLoanAmount_v1 {
    /**
     * @notice Returns the total amount owed for a specified loan.
     * @param loanID The loan ID to get the total amount owed.
     * @return uint256 The amount owed.
     */
    function getLoanAmount(uint256 loanID) public view returns (uint256) {
        return _getLoanAmount(loanID);
    }
}

abstract contract ext_getLoanAmount_AUTOUPDATE is ext_getLoanAmount_v1 {}
