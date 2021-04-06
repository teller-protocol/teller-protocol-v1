// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_Loans } from "../internal/get-loans-storage.sol";
import "../../protocol/interfaces/IPlatformSettings.sol";
import "../data/loans.sol";

abstract contract ext_can_go_to_eoa_v1 is int_get_sto_Loans, dat_Loans_v1 {
    function canGoToEOA(uint256 loanID) external view returns (bool) {
        uint256 overCollateralizedBuffer =
            IPlatformSettings(PROTOCOL).getOverCollateralizedBufferValue();
        return
            s().loans[loanID].loanTerms.collateralRatio >=
            overCollateralizedBuffer;
    }
}

abstract contract ext_can_go_to_eoa is ext_can_go_to_eoa_v1 {}
