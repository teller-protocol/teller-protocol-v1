// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/loans.sol";

abstract contract int_get_sto_Loans is sto_Loans {
    function s() internal pure returns (LoansLayout storage l_) {
        l_ = getLoansStorage();
    }
}
