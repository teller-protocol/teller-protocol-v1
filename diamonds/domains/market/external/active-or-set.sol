// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_Loans } from "../internal/get-loans-storage.sol";

abstract contract ext_active_or_set_v1 is int_get_sto_Loans {
    function isActiveOrSet(uint256 loanID) public view override returns (bool) {
        return
            s().loans[loanID].status == TellerCommon.LoanStatus.Active ||
            s().loans[loanID].status == TellerCommon.LoanStatus.TermsSet;
    }
}

abstract contract ext_active_or_set is ext_active_or_set_v1 {}
