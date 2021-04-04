// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/loans.sol";

abstract contract int_get_sto_Loans_v1 is sto_Loans {
    function s() internal pure returns (sto_Loans.Layout storage l_) {
        l_ = getLoansStorage();
    }
}

abstract contract int_get_sto_Loans is int_get_sto_Loans_v1 {}
